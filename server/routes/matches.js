const express = require('express');
const router = express.Router();
const SuggestedMatch = require('../models/SuggestedMatch');

router.get('/suggestions/:userId', async (req, res) => {
    try{
        const userId = req.params.userId;
        const suggestions = await SuggestedMatch.find({userId: userId});

        if(!suggestions||suggestions.length === 0){
            return res.status(404).json({message: 'No suggestions found for this user'});
        }
        res.status(200).json(suggestions);
    } catch (error) {
        res.status(500).json({message: error.message});
    }

});

module.exports = router;