const { spawn } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const SuggestedMatch = require('../models/SuggestedMatch');

/**
 * שליפת הצעות קיימות מהדאטה-בייס (עבור ה-Angular)
 */
exports.getSuggestions = async (req, res) => {
    try {
        const userIdStr = req.params.userId;
        const today = new Date().toISOString().split('T')[0]; // קבלת תאריך היום בפורמט YYYY-MM-DD

        console.log(`--- Fetching suggestions for: ${userIdStr} ---`);

        const query = {
            user_id: userIdStr,  // string בלבד, בלי ObjectId
            "match.match_date": { $gte: today }
        };

        const matches = await SuggestedMatch.find(query).sort({ "match.match_date": 1 });

        if (!matches || matches.length === 0) {
            return res.status(404).json({ 
                message: 'No upcoming matches found',
                debug_info: { searched_id: userIdStr, date_filter: today }
            });
        }

        res.status(200).json(matches);
    } catch (error) {
        console.error("Critical Error in getSuggestions:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * הפעלת מנוע הפייתון לעדכון נתונים בזמן אמת
 */
exports.triggerEngine = (req, res) => {
    const userId = req.params.userId;
    const scriptPath = path.join(__dirname, '..', 'scripts', 'engine.py');
    
    console.log(`--- Starting Python Engine for user: ${userId} ---`);

    const pythonProcess = spawn('python', [scriptPath, userId]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Output: ${data.toString()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            console.log("Engine finished successfully.");
            res.status(200).json({ message: 'Engine updated matches successfully' });
        } else {
            console.error(`Engine failed with code: ${code}`);
            res.status(500).json({ message: 'Engine execution failed' });
        }
    });
};