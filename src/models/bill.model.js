
import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
    {
        billNumber: {
            type: String,
            required: true,
            unique: true
        },

        cashier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                name: {
                    type: String,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                price: {
                    type: Number,
                    required: true,
                    min: 0
                },

                subtotal: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
        ],

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentMethod: {
            type: String,
            enum: ["Cash", "UPI", "Card"],
            required: true
        },

        paymentStatus: {
            type: String,
            enum: ["Paid", "Pending", "Failed"],
            default: "Pending"
        },

        status: {
            type: String,
            enum: ["Completed", "Cancelled", "Refunded"],
            default: "Completed"
        }
    },
    { timestamps: true }
);

export const Bill = mongoose.model("Bill", billSchema);
