const express = require('express');
const router = express.Router();
const { addComment, getCommentsByTicket, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addComment);
router.get('/ticket/:ticketId', protect, getCommentsByTicket);
router.delete('/:id', protect, deleteComment);

module.exports = router;
