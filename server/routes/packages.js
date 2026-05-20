const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

router.post('/:userId', packageController.getPackages);

module.exports = router;