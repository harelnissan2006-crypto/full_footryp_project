const mongoose = require('mongoose');

const SuggestedMatchSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    team: { type: String },
    match: { type: Object, required: true },
    flight_availability: { type: Object },
    status: { type: String },
    updated_at: { type: Date }
}, { collection: 'suggested_matches' });

module.exports = mongoose.model('SuggestedMatch', SuggestedMatchSchema);