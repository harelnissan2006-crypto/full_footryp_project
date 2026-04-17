const {spawn} = require('child_process');
const path = require('path');

exports.generateSuggestions = (req, res) => {
    const userId = req.params.userId;
    const scriptPath = path.join(__dirname, '..', 'scripts', 'engine.py');
    const pythonProcess = spawn('python', [scriptPath, userId]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python output: ${data.toString()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            res.status(200).json({message: 'Suggestions generated successfully'});
        }else{
            res.status(500).json({message: 'Failed to generate suggestions'});
        }
    });
}