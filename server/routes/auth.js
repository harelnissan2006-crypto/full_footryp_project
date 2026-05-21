const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const {spawn} = require('child_process');
const path = require('path');
const {authMiddleware, JWT_SECRET} = require('../middleware/auth');
const { error } = require('console');


const runMatchesEngine = (userId) => {
    return new Promise((resolve, reject)=>{
        const scriptPath = path.join(__dirname, '..', 'scripts', 'engine.py');
        console.log('Running matches engine for user:', userId);
        const pythonProcess = spawn('python', [scriptPath, userId]);
        
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python output: ${data.toString()}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python error: ${data.toString()}`);
        });

        pythonProcess.on('close', (code)=>{
            if(code===0){
                resolve();
            }else{
                reject(new Error(`Python script exited with code ${code}`));
            }
        });
    });
};

router.post('/register', async (req, res) => {
    try{
        const {password, ...rest} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({...rest, password: hashedPassword});
        await newUser.save();
        runMatchesEngine(newUser._id.toString());
        res.status(201).json({message: 'User Created Successfully', userId: newUser._id});
    } catch (error) {
        res.status(400).json({message: 'Error creating user', error: error.message});
    }
});


router.post('/login', async (req, res) => {
    try{
        const user = await User.findOne({username: req.body.username});
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if(!isMatch){
            return res.status(401).json({message: 'Invalid password'});
        }
        const token = jwt.sign(
            {userId: user._id.toString()},
            JWT_SECRET,
            {expiresIn: '7d'}
        );
        res.status(200).json({
            message: 'Login successful',
            token,
            userId: user._id,
            username: user.username
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try{
        const user = await User.findById(req.params.id).select('-password');
        res.json(user);
    }catch(error){
        res.status(404).json({message: 'User not found'});
    }
});


router.put('/:id', authMiddleware, async (req, res) => {
    try{
        if(req.body.password){
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, req.body, {new: true}
        ).select('-password');
        await runMatchesEngine(req.params.id);
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(400).json({message: error.message});
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try{
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    }catch{
        res.status(404).json({message: 'User not found'});
    }
});

router.get('/chat/:matchId/messages', authMiddleware, async (req, res) => {
    try{
        res.set('Cache-Control', 'no-store');
        const messages = await Message.find({matchId: req.params.matchId})
            .sort({timestamp: 1})
            .limit(50);
        res.json(messages);
    }catch(error){
        res.status(500).json({error: error.message});
    }
});

router.get('/chat/:matchId/participants', authMiddleware, async (req, res) => {
    try{
        const room = await ChatRoom.findOne({matchId:req.params.matchId});
        res.json(room ? room.participants : []);
    }catch(error){
        res.status(500).json({error: error.message});
    }
});


module.exports = router;
