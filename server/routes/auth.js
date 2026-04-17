const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {spawn} = require('child_process');
const path = require('path');

const runMatchesEngine = (userId) => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'engine.py');
    console.log('Running matches engine for user:', userId);
    const pythonProcess = spawn('python', [scriptPath, userId]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python output: ${data.toString()}`);
    }
    );

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data.toString()}`);
    });
}

router.post('/register', async (req, res) => {
    try{
        const newUser = new User(req.body);
        await newUser.save();
        runMatchesEngine(newUser._id.toString());
        res.status(201).json({message: 'User Created Successfully', userId: newUser._id});
    } catch (error) {
        res.status(400).json({message: 'Error creating user', error: error.message});
    }
});

router.get('/:id', async (req, res) => {
    try{
        const user = await User.findById(req.params.id);
        res.json(user);
    }catch (error) {
        res.status(404).json({message: 'User not found'});
    }
});

router.put('/:id', async (req, res) => {
    try{
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {new: true});
        runMatchesEngine(req.params.id);
        res.json(updatedUser);
    }catch (error) {
        res.status(400).json({message: error.message});
    }
});
router.post('/login', async (req, res) => {
    try{
        const user = await User.findOne({username: req.body.username, password: req.body.password});
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json({message: 'Login successful', userId: user._id});
    }catch (error) {
        res.status(500).json({error: error.message});
    }
});


module.exports = router;
