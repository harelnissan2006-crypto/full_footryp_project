const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs'); // חובה להוסיף
const path = require('path'); // חובה להוסיף

const authRoutes = require('./routes/Auth');
const matchRoutes = require('./routes/matches');

const app = express();
app.use(cors());
app.use(express.json());

// --- כאן צריכה להיות הפונקציה החדשה ---
app.get('/api/teams', (req, res) => {
    try {
        const mappingPath = path.join(__dirname, 'scripts', 'mapping.json');
        const rawData = fs.readFileSync(mappingPath, 'utf8');
        const mapping = JSON.parse(rawData);

        const teams = Object.entries(mapping).map(([name, info]) => ({
            name: name,
            id: info.team_id
        }));

        res.json(teams);
    } catch (error) {
        console.error("Error reading mapping:", error);
        res.status(500).json({ message: "Could not load teams" });
    }
});

// שאר הראוטים שלך
app.use('/api/users', authRoutes);
app.use('/api/matches', matchRoutes);

// התחברות ל-DB
mongoose.connect('mongodb://localhost:27017/footryp')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// ה-Listen חייב להיות בסוף!
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});