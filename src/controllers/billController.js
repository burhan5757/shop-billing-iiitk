
import details from '../config/db.js';

export const createBill = async (req, res) => {
    const { items, payment_method } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            msg: 'Cart is empty'
        });
    }

    if (!['Cash', 'UPI', 'Card'].includes(payment_method)) {
        return res.status(400).json({
            msg: 'Invalid payment method'
        });
    }

    // Combine duplicate products in the cart
    const cart = new Map();

    for (const item of items) {
        const { product_id, quantity } = item;

        if (!Number.isInteger(product_id) || product_id <= 0 ||
            !Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                msg: 'Invalid product ID or quantity'
            });
        }

        cart.set(
            product_id,
            (cart.get(product_id) || 0) + quantity
        );
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await details.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        let total_amount = 0;
        const billItems = [];

        for (const [product_id, quantity] of cart) {

            const [products] = await connection.query(
                `SELECT product_id, product_name, price, quantity
                 FROM products
                 WHERE product_id = ? AND is_active = TRUE
                 FOR UPDATE`,
                [product_id]
            );

            if (products.length === 0) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }

            const product = products[0];

            if (product.quantity < quantity) {
                const error = new Error(
                    `Insufficient stock for ${product.product_name}`
                );
                error.statusCode = 409;
                throw error;
            }

            // Calculate using cents to avoid floating-point
            // errors with decimal prices
            const unitPriceCents = Math.round(
                Number(product.price) * 100
            );

            const subtotalCents = unitPriceCents * quantity;

            total_amount += subtotalCents;

            billItems.push({
                product_id,
                quantity,
                unit_price: (unitPriceCents / 100).toFixed(2),
                subtotal: (subtotalCents / 100).toFixed(2)
            });

            await connection.query(
                `UPDATE products
                 SET quantity = quantity - ?
                 WHERE product_id = ?`,
                [quantity, product_id]
            );
        }

        total_amount = (total_amount / 100).toFixed(2);

        const bill_number = `BILL-${Date.now()}`;

        const [bill] = await connection.query(
            `INSERT INTO bills
             (bill_number, total_amount, payment_method)
             VALUES (?, ?, ?)`,
            [bill_number, total_amount, payment_method]
        );

        for (const item of billItems) {
            await connection.query(
                `INSERT INTO bill_items
                 (bill_id, product_id, quantity, unit_price, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    bill.insertId,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.subtotal
                ]
            );
        }

        await connection.commit();
        transactionStarted = false;

        res.status(201).json({
            msg: 'Bill created successfully',
            bill_id: bill.insertId,
            bill_number,
            total_amount
        });

    } catch (err) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error(err.message);

        res.status(err.statusCode || 500).json({
            msg: err.statusCode
                ? err.message
                : 'Internal server error'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const getBills = async (req, res) => {
    try {
        // get all bills with their purchased products
        const [query] = await details.query(`
            SELECT
                bills.bill_id,
                bills.bill_number,
                bills.total_amount,
                bills.payment_method,
                bills.payment_status,
                bills.created_at,
                bill_items.product_id,
                products.product_name,
                bill_items.quantity,
                bill_items.unit_price,
                bill_items.subtotal
            FROM bills
            LEFT JOIN bill_items
                ON bills.bill_id = bill_items.bill_id
            LEFT JOIN products
                ON bill_items.product_id = products.product_id
            ORDER BY bills.created_at DESC, bills.bill_id DESC
        `);

        const bills = new Map();

        // keep products with their respective bills
        for (const row of query) {
            if (!bills.has(row.bill_id)) {
                bills.set(row.bill_id, {
                    bill_id: row.bill_id,
                    bill_number: row.bill_number,
                    total_amount: row.total_amount,
                    payment_method: row.payment_method,
                    payment_status: row.payment_status,
                    created_at: row.created_at,
                    items: []
                });
            }

            // Add the product to the bill
            if (row.product_id !== null) {
                bills.get(row.bill_id).items.push({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    quantity: row.quantity,
                    unit_price: row.unit_price,
                    subtotal: row.subtotal
                });
            }
        }

        // Return all bills with their items
        res.status(200).json({
            bills: Array.from(bills.values())
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Internal server error' });
    }
};