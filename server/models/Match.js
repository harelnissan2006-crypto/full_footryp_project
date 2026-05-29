const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    apiMatchId: { type: Number, required: true, unique: true },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    homeCrest: {type: String},
    awayCrest: {type: String},
    match_date: { type: String, required: true },
    match_time: { type: String, required: true },
    flight_date: { type: String, required: true },
    home_city: { type: String, required: true },
    home_iata: { type: String, required: true },
    distance_from_tlv: { type: Number, required: true },
    timezone: {type: String},
    competition: { type: String },
    team_ids: [{ type: Number }],
    last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', matchSchema);