import express from 'express';
import auth from '../middlewares/authMiddleware.js';
import { getProducts, addProduct, deleteProduct } from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/',auth,addProduct)
router.delete('/:id',auth,deleteProduct);


export default router;