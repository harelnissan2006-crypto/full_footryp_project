const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

/**
 * GET /api/matches/suggestions/:userId
 * שולף את רשימת המשחקים העתידיים מה-DB להצגה ב-Frontend
 */
router.get('/suggestions/:userId', matchController.getSuggestions);

/**
 * POST /api/matches/trigger/:userId
 * מריץ את מנוע הפייתון כדי לרענן את הנתונים (מחיקת ישנים וכתיבת חדשים)
 */
router.post('/trigger/:userId', matchController.triggerEngine);

module.exports = router;