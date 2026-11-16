import express from 'express';
import { createBill, getBills } from '../controllers/billController.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', createBill);
router.get('/', auth, getBills);

export default router;
