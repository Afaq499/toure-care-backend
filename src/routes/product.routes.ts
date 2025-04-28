import { Router } from 'express';
import { auth } from '../middleware/auth.middleware';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getUnassignedProducts
} from '../controllers/product.controller';

const router = Router();

// Protected routes
router.post('/', auth, createProduct);
router.get('/', auth, getAllProducts);
router.get('/unassigned/:userId', auth, getUnassignedProducts);
router.get('/:id', auth, getProductById);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);

export default router; 