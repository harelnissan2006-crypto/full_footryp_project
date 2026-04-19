const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SuggestedMatch = require('../models/SuggestedMatch');

router.get('/suggestions/:userId', async (req, res) => {
    try {
        const userIdStr = req.params.userId;
        console.log("--- Debug Match Search ---");
        console.log("Searching for User ID String:", userIdStr);

        let suggestions = await SuggestedMatch.find({ user_id: userIdStr });
        
        if (!suggestions || suggestions.length === 0) {
            console.log("Not found as String, trying as ObjectId...");
            const objectId = new mongoose.Types.ObjectId(userIdStr);
            suggestions = await SuggestedMatch.find({ user_id: objectId });
        }

        console.log("Results count:", suggestions ? suggestions.length : 0);
        console.log("--------------------------");

        if (!suggestions || suggestions.length === 0) {
            return res.status(404).json({ 
                message: 'No suggestions found',
                debug_info: { searched_id: userIdStr }
            });
        }
        
        res.status(200).json(suggestions);
    } catch (error) {
        console.error("Critical Server Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;