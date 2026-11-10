import express from "express";
import cors from "cors";
import cartRouter from "./routes/cart.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Cart Backend is running!");
});

app.use("/api/cart", cartRouter);

export default app;