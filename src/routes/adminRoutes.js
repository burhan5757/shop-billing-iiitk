import express from "express";
import {login} from "../controllers/adminController.js"

const router = express.router();

router.post('/login',login);

export default router;


