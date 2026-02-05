const express = require('express');
const router = express.Router();
const {
    createTicket,
    getTicketsByProject,
    updateTicket,
    deleteTicket,
    addAttachments,
    removeAttachment
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All ticket routes are protected
router.use(protect);

router.post('/', createTicket);
router.get('/project/:projectId', getTicketsByProject);

router.route('/:id')
    .put(updateTicket)
    .delete(deleteTicket);

router.post('/:id/attachments', upload.array('attachments', 5), addAttachments);
router.delete('/:id/attachments/:attachmentId', removeAttachment);

module.exports = router;
