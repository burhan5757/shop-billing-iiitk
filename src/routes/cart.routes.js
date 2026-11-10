import express from "express";
import { addToCart,getCart,updateCart,removeFromCart,clearCart,checkout  } from "../controllers/cart.controller.js";

const router = express.Router();

router.post("/add", addToCart);
router.get("/", getCart);
router.patch("/update", updateCart);
router.delete("/remove", removeFromCart);
router.delete("/clear", clearCart);
router.post("/checkout", checkout);

export default router;