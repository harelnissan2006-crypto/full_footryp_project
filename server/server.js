const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const http = require('http');
const {Server} = require('socket.io');
const userRoutes = require('./routes/users');

const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
const authRoutes = require('./routes/Auth');
const matchRoutes = require('./routes/matches');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users-data', userRoutes);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

const roomUsers = new Map();
const roomAllUsers = new Map();

io.on('connection', (socket) => {

    socket.on('joinRoom', async ({ matchId, username }) => {
        socket.join(matchId);
        socket.data.matchId = matchId;
        socket.data.username = username;

        if (!roomUsers.has(matchId)) roomUsers.set(matchId, new Set());
        roomUsers.get(matchId).add(username);

        await ChatRoom.findOneAndUpdate(
            { matchId },
            { $addToSet: { participants: username } },
            { upsert: true }
        );

        const room = await ChatRoom.findOne({ matchId });
        const allParticipants = room ? room.participants : [username];

        io.to(matchId).emit('online_users', Array.from(roomUsers.get(matchId)));
        io.to(matchId).emit('all_users', allParticipants);
        console.log(`${username} joined room: ${matchId}`);
    });

    socket.on('send_message', async (data) => {
        const { matchId, senderName, content } = data;
        const newMessage = new Message({
            matchId,
            senderName,
            senderId: "69e1f8afa8808e8feb8d1172",
            content,
            timestamp: new Date()
        });
        await newMessage.save();
        io.to(matchId).emit('receive_message', newMessage);
        console.log(`Message sent to match room ${matchId}: ${content}`);
    });

    socket.on('leaveRoom', async ({ matchId, username }) => {
        socket.leave(matchId);

        if (roomUsers.has(matchId)) {
            roomUsers.get(matchId).delete(username);
            io.to(matchId).emit('online_users', Array.from(roomUsers.get(matchId)));
        }

        await ChatRoom.findOneAndUpdate(
            { matchId },
            { $pull: { participants: username } }
        );

        const room = await ChatRoom.findOne({ matchId });
        io.to(matchId).emit('all_users', room ? room.participants : []);
        console.log(`${username} left room: ${matchId}`);
    });

    socket.on('disconnect', () => {
        const { matchId, username } = socket.data;
        if (matchId && username && roomUsers.has(matchId)) {
            roomUsers.get(matchId).delete(username);
            io.to(matchId).emit('online_users', Array.from(roomUsers.get(matchId)));
            // disconnect = נשאר ב-allUsers
        }
    });

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
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});