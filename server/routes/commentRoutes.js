import express from 'express';
import { getCommentsForPost, createComment, deleteComment } from '../controllers/commentController.js';
import { protect } from '../middlewares/auth.js'; 

const router = express.Router();

router.get('/:postId', getCommentsForPost);
router.post('/', protect, createComment); 
router.delete('/:commentId', protect, deleteComment);

export default router;