const User = require('../models/User');
const path = require('path');
const {spawn} = require('child_process');

exports.getSuggestionsWeighted = async (req, res) => {
    try{
        const currentUser = await User.findById(req.params.userId);
        if (!currentUser) {
            return res.status(404).json({message: "User not found"});
        }
        const allUsers = await User.find({_id: {$ne: currentUser._id}});
        const scored = allUsers.map(other=>{
            let score = 0;
            if(currentUser.favoriteTeamId && other.favoriteTeamId && currentUser.favoriteTeamId === other.favoriteTeamId){
                score +=50;
            }
            const myTeams = currentUser.otherInterestTeamsIds || [];
            const otherTeams = other.otherInterestTeamsIds || [];
            if(myTeams.length > 0 || otherTeams.length > 0){
                const allTeams = new Set([...myTeams, ...otherTeams]);
                const sharedTeams = myTeams.filter(team => otherTeams.includes(team)).length;
                score += (sharedTeams/allTeams.size)*20;
            }
            if(currentUser.budgetLevel && other.budgetLevel){
                const diff = Math.abs(currentUser.budgetLevel - other.budgetLevel);
                score+=(1-diff/4)*15;
            }
            if(currentUser.riskTolerance && other.riskTolerance){
                const diff = Math.abs(currentUser.riskTolerance - other.riskTolerance);
                score+=(1-diff/4)*10;
            }
            if(currentUser.age && other.age){
                const diff = Math.abs(currentUser.age - other.age);
                score+=(1-diff/10)*5;
            }
            return{
                userId: other._id,
                username: other.username,
                favoriteTeamId: other.favoriteTeamId,
                otherInterestTeamsIds: other.otherInterestTeamsIds,
                budgetLevel: other.budgetLevel,
                riskTolerance: other.riskTolerance,
                age: other.age,
                matchScore: Math.round(score)
            };
        });
        const sorted = scored
            .filter(u=>u.matchScore>0)
            .sort((a,b)=>b.matchScore-a.matchScore);
        res.json(sorted);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};

exports.getSuggestions = async (req, res) => {
    const userId = req.params.userId;
    const scriptPath = path.join(__dirname, '..', 'scripts', 'usersKNN.py')

    const pythonProcess = spawn('python', [scriptPath, userId]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
        output +=data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput +=data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code===0){
            try{
                const result = JSON.parse(output);
                res.json(result);
            }catch(err){
                console.error('KNN parse error:', err);
                res.status(500).json({message: 'Error parsing KNN output'});
            }
        }
        else{
            console.error('KNN failed, falling back to weighted scoring');
            exports.getSuggestionsWeighted(req, res);
        }
    });
}