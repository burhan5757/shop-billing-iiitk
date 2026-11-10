import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./db/index.js";

const startServer = async () => {
    try {
        await connectDB();

        app.listen(process.env.PORT, () => {
            console.log(
                `Server running on port ${process.env.PORT}`
            );
        });

    } catch (error) {
        console.log("Server startup failed:", error);
    }
};

startServer();