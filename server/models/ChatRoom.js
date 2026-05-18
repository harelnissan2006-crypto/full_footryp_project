const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    matchId: { type: String, required: true, unique: true },
    participants: [{ type: String}]
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);