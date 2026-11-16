import details from '../config/db.js';

export const getProducts = async (req,res) => {
    try{
        const [query] = await details.query('SELECT * FROM products WHERE is_active = TRUE');

    res.status(200).json({
        products: query
    })
    }
    catch(err){
        console.error(err.message);

        res.status(500).json({
            msg: 'Internal server error'
        });
    }
}

export const addProduct = async (req, res) => {

    try {
        const { product_name, category, price, quantity } = req.body;


        if (
            !product_name?.trim() ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0 ||
            quantity === undefined ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                msg: 'Invalid product details'
            });
        }

        const [query] = await details.query(
            `INSERT INTO products (product_name, category, price, quantity)
             VALUES (?, ?, ?, ?)`,
            [product_name, category, price, quantity]
        );

        res.status(201).json({
            msg: 'Product added successfully',
            product_id: query.insertId
        });

    } catch (err) {
        console.error(err.message);

        res.status(500).json({
            msg: 'Internal server error'
        });
    }
};

export const deleteProduct = async (req,res) => {
    try {
        const {id} = req.params;

        const [query] = await details.query('update products set is_active = false where product_id = ?',[id])

        if(query.affectedRows === 0){
            return res.status(404).json({
                msg: 'Product not found'
            })
        }
        
        res.status(200).json({
            msg: 'Deleted Successfully'
        })

    } catch (err) {
        console.error(err.message)

        res.status(500).json({
            msg: 'Internal server error'
        })
    }
}