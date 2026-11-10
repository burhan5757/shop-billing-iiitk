
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { Bill } from "../models/bill.model.js";

const addToCart = async (req, res) => {
    try {
        const { productId, quantity, userId } = req.body;

        // Validate incoming data
        if (!productId || !userId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Product ID, user ID and quantity are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId) ||
            !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID or product ID"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive integer"
            });
        }

        // 2. Find the product
        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found or inactive"
            });
        }

        // 3. Find the user's cart or create one
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [],
                totalAmount: 0
            });
        }

        // 4. Check whether product already exists
        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        const newQuantity = existingItem
            ? existingItem.quantity + quantity
            : quantity;

        // 5. Check stock availability
        if (newQuantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} units available`
            });
        }

        // 6. Update quantity or add new item
        if (existingItem) {
            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({
                product: product._id,
                quantity,
                price: product.price
            });
        }

        // 7. Calculate total amount
        cart.totalAmount = cart.items.reduce(
            (total, item) => total + item.quantity * item.price,
            0
        );

        // 8. Save cart
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Product added to cart successfully",
            cart
        });

    } catch (error) {
        console.error("Add to cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getCart = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const productIds = cart.items.map(item => item.product);

        const products = await Product.find({
            _id: { $in: productIds }
        });

        const cartItems = cart.items.map(item => {
            const product = products.find(
                p => p._id.toString() === item.product.toString()
            );

            return {
                product: product || null,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.quantity * item.price
            };
        });

        return res.status(200).json({
            success: true,
            items: cartItems,
            totalAmount: cart.totalAmount
        });

    } catch (error) {
        console.error("Get cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const updateCart = async (req, res) => {
    try {
        // 1. Get data from frontend
        const { userId, productId, quantity } = req.body;

        // 2. Validate input
        if (!userId || !productId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(productId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive integer"
            });
        }

        // 3. Find the shopkeeper's cart
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // 4. Find the product inside the cart
        const item = cart.items.find(
            item => item.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        // 5. Check product stock
        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found or inactive"
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} units available`
            });
        }

        // 6. Update quantity
        item.quantity = quantity;

        // 7. Recalculate total amount
        cart.totalAmount = cart.items.reduce(
            (total, item) => total + item.quantity * item.price,
            0
        );

        // 8. Save updated cart
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart
        });

    } catch (error) {
        console.error("Update cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const removeFromCart = async (req, res) => {
    try {
        // 1. Get data from frontend
        const { userId, productId } = req.body;

        // 2. Validate input
        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Product ID are required"
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(productId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID"
            });
        }

        // 3. Find the shopkeeper's cart
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // 4. Check whether product exists in cart
        const itemExists = cart.items.some(
            item => item.product.toString() === productId
        );

        if (!itemExists) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        // 5. Remove the selected product
        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        // 6. Recalculate total amount
        cart.totalAmount = cart.items.reduce(
            (total, item) => total + item.quantity * item.price,
            0
        );

        // 7. Save updated cart
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from cart successfully",
            cart
        });

    } catch (error) {
        console.error("Remove from cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const clearCart = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID is required"
            });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Remove all products
        cart.items = [];

        // Reset total amount
        cart.totalAmount = 0;

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart
        });

    } catch (error) {
        console.error("Clear cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


const checkout = async (req, res) => {
    try {
        const { userId, paymentMethod } = req.body;

        // 1. Validate input
        if (!userId || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: "User ID and payment method are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        if (!["Cash", "UPI", "Card"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        // 2. Find cart
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot checkout with an empty cart"
            });
        }

        // 3. Validate products and prepare bill items
        const billItems = [];

        for (const item of cart.items) {

            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            if (!product.isActive) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} is inactive`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available stock: ${product.stock}`
                });
            }

            if (product.price !== item.price) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} price has changed. Please update your cart.`
                });
            }

            // Prepare bill item
            billItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.quantity * item.price
            });
        }

        // Calculate total from bill items
        const totalAmount = billItems.reduce(
            (total, item) => total + item.subtotal,
            0
        );

        // 4. Track deducted stock
        const deductedProducts = [];

        let bill;

        try {

            // 5. Deduct stock
            for (const item of cart.items) {

                const updatedProduct = await Product.findOneAndUpdate(
                    {
                        _id: item.product,
                        stock: { $gte: item.quantity },
                        isActive: true
                    },
                    {
                        $inc: { stock: -item.quantity }
                    },
                    {
                        new: true
                    }
                );

                if (!updatedProduct) {
                    const error = new Error(
                        "Stock is no longer available. Checkout failed."
                    );

                    error.statusCode = 409;

                    throw error;
                }

                // Store successfully deducted stock
                deductedProducts.push({
                    productId: item.product,
                    quantity: item.quantity
                });
            }

            // 6. Generate bill number
            const billNumber = "BILL-" + Date.now();

            // 7. Create bill
            bill = await Bill.create({
                billNumber,
                cashier: userId,
                items: billItems,
                totalAmount,
                paymentMethod,
                paymentStatus: "Paid"
            });

            // 8. Clear cart
            cart.items = [];
            cart.totalAmount = 0;

            await cart.save();

        } catch (error) {

            // 9. Rollback: Restore deducted stock
            for (const deducted of deductedProducts) {
                try {
                    await Product.findByIdAndUpdate(
                        deducted.productId,
                        {
                            $inc: { stock: deducted.quantity }
                        }
                    );
                } catch (rollbackError) {
                    console.log(
                        "Stock rollback failed:",
                        rollbackError
                    );
                }
            }

            // 10. Delete bill if it was already created
            if (bill) {
                try {
                    await Bill.findByIdAndDelete(bill._id);
                } catch (rollbackError) {
                    console.log(
                        "Bill rollback failed:",
                        rollbackError
                    );
                }
            }

            throw error;
        }

        // 11. Successful response
        return res.status(200).json({
            success: true,
            message: "Checkout successful",
            bill
        });

    } catch (error) {

        console.log("Checkout error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Internal server error"
        });
    }
};




export { addToCart,getCart,updateCart,removeFromCart,clearCart,checkout };
