const { spawn } = require('child_process');
const path = require('path');
const SuggestedMatch = require('../models/SuggestedMatch');
const Match = require('../models/Match');

exports.getSuggestions = async (req, res) => {
    try {
        const userIdStr = req.params.userId;
        const filterDate = req.query.fromDate;
        const filterCompetition = req.query.competition;

        const query = { user_id: userIdStr };
        if (filterDate) {
            query["match.match_date"] = { $gte: filterDate };
        }
        if (filterCompetition) {
            query["competition"] = filterCompetition;
        }

        const matches = await SuggestedMatch.find(query).sort({ "match.match_date": 1 });

        if (!matches || matches.length === 0) {
            return res.status(404).json({ message: 'No matches found' });
        }

        res.status(200).json(matches);
    } catch (error) {
        console.error("Critical Error in getSuggestions:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

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

exports.fetchAllMatches = (req, res) => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'engine.py');

    console.log('--- Starting full match fetch ---');
    const pythonProcess = spawn('python', [scriptPath, '--fetch-all']);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Output: ${data.toString()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            res.status(200).json({ message: 'All matches fetched and stored successfully' });
        } else {
            res.status(500).json({ message: 'Fetch failed' });
        }
    });
};
exports.getCompetitions = async (req, res) => {
    try {
        const userIdStr = req.params.userId;

        const matches = await SuggestedMatch.find({ user_id: userIdStr });

        if (!matches || matches.length === 0) {
            return res.status(200).json([]);
        }

        const competitions = [...new Set(
            matches
                .map(m => m.competition)
                .filter(c => c && c !== 'Unknown')
        )].sort();

        res.status(200).json(competitions);
    } catch (error) {
        console.error("Error in getCompetitions:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};