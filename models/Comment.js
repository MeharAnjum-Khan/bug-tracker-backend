const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Please provide comment text'],
        trim: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
    },
}, {
    timestamps: true,
});

// Add index for faster queries on tickets
commentSchema.index({ ticket: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
