const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const Match = require('../models/Match');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

router.get('/suggestions/:userId', userController.getSuggestions);

router.get('/chats/:username', async (req, res) =>{
    try{
        const {username} = req.params;
        const chats = [];
        const existingIds = new Set();

        const rooms = await ChatRoom.find({ participants: username }).select('matchId participants').lean();

        for (const room of rooms) {
            const matchId = room.matchId;
            if (typeof matchId !== 'string') continue;

            if (matchId.startsWith('dm_')) {
                const participants = Array.isArray(room.participants) ? Array.from(new Set(room.participants)) : [];
                if (participants.length >= 2 && participants.includes(username)) {
                    const otherUser = participants.find(p => p !== username) || participants[0];
                    const pair = [username, otherUser].sort();
                    const canonicalId = `dm_${pair[0]}_${pair[1]}`;
                    if (!existingIds.has(canonicalId)) {
                        chats.push({ matchId: canonicalId, isDM: true, otherUser });
                        existingIds.add(canonicalId);
                    }
                }
            } else {
                chats.push({ matchId, isDM: false });
                existingIds.add(matchId);
            }
        }

        // If no DM ChatRoom was found, derive DM ids from messages and current username.
        const dmMatchIds = await Message.find({ matchId: new RegExp(`^dm_.*${username}.*`) }).distinct('matchId');
        for (const rid of dmMatchIds) {
            if (!rid) continue;
            const senders = await Message.find({ matchId: rid }).distinct('senderName');
            const uniqueSenders = senders.filter(s => !!s);
            if (uniqueSenders.length >= 2) {
                const pair = uniqueSenders.slice(0, 2).sort();
                const canonicalId = `dm_${pair[0]}_${pair[1]}`;
                if (existingIds.has(canonicalId)) continue;
                const otherUser = pair[0] === username ? pair[1] : pair[0];
                chats.push({ matchId: canonicalId, isDM: true, otherUser });
                existingIds.add(canonicalId);
                continue;
            }

            // If only one sender exists, split the raw id using the current username boundaries.
            const raw = rid.slice(3);
            const selfIndex = raw.indexOf(username);
            if (selfIndex !== -1) {
                const before = raw.slice(0, selfIndex).replace(/_$/, '');
                const after = raw.slice(selfIndex + username.length).replace(/^_/, '');
                const otherUser = before || after;
                if (otherUser) {
                    const pair = [username, otherUser].sort();
                    const canonicalId = `dm_${pair[0]}_${pair[1]}`;
                    if (!existingIds.has(canonicalId)) {
                        chats.push({ matchId: canonicalId, isDM: true, otherUser });
                        existingIds.add(canonicalId);
                    }
                    continue;
                }
            }

            // Last resort: try a raw split at the first underscore boundary after prefix
            const fields = raw.split('_');
            if (fields.length >= 2) {
                const otherUser = fields.slice(0, -1).join('_') === username ? fields.slice(-1).join('_') : fields.slice(0, -1).join('_');
                const pair = [username, otherUser].sort();
                const canonicalId = `dm_${pair[0]}_${pair[1]}`;
                if (!existingIds.has(canonicalId)) {
                    chats.push({ matchId: canonicalId, isDM: true, otherUser });
                    existingIds.add(canonicalId);
                }
            }
        }

        res.json(chats);
    }catch(err){
        res.status(500).json({error: err.message});
    }
})

module.exports = router;