const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/suggestions/:userId', userController.getSuggestions);

module.exports = router;