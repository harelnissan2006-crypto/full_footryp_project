const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

router.get('/suggestions/:userId', matchController.getSuggestions);

router.post('/trigger/:userId', matchController.triggerEngine);

router.post('/fetch-all', matchController.fetchAllMatches);

router.get('/competitions/:userId', matchController.getCompetitions);
module.exports = router;