const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const http = require('http');
const {Server} = require('socket.io');

const Message = require('./models/Message');
const authRoutes = require('./routes/Auth');
const matchRoutes = require('./routes/matches');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    socket.on('joinMatchRoom', (matchId) => {
        socket.join(matchId);
        console.log(`User joined match room: ${matchId}`);
    });
    socket.on('sendMessage', (data) => {
        const {matchId, content, senderName} = data;
        const messageData = {
            senderName, content, timestamp: new Date()
        };
        io.to(matchId).emit('newMessage', messageData);
        console.log(`Message sent to match room ${matchId}: ${content}`);
    });
});

socket.on('sendMessage', async (data) => {
    const {matchId, content, senderName} = data;

    const newMessage = new Message({
        matchId: matchId,
        senderName: senderName,
        senderId:"69e1f8afa8808e8feb8d1172",
        content: content,
        timestamp: new Date()
    });
    await newMessage.save();
    io.to(matchId).emit('recieve_message', newMessage);
});

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

app.use('/api/users', authRoutes);
app.use('/api/matches', matchRoutes);

mongoose.connect('mongodb://localhost:27017/footryp')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});