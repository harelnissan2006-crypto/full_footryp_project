const { spawn } = require('child_process');
const path = require('path');

exports.getPackages = (req, res) => {
    const { userId } = req.params;
    let matchData = req.body;

    if (matchData && matchData.match) {
        matchData = matchData.match;
    }

    if (!matchData || !matchData.home_iata) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const scriptPath = path.join(__dirname, '..', 'scripts', 'packages.py');
    const pythonProcess = spawn('python', [scriptPath, userId, JSON.stringify(matchData)]);

    let output = '';

    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.log('packages.py:', data.toString().trim());
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            try {
                const result = JSON.parse(output.trim());
                res.json(result);
            } catch (err) {
                console.error('Parse error:', err, 'Output:', output);
                res.status(500).json({ message: 'Error processing packages data' });
            }
        } else {
            res.status(500).json({ message: 'Error generating packages' });
        }
    });
};