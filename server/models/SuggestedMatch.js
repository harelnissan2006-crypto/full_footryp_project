const mongoose = require('mongoose');

const SuggestedMatchSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    team: { type: String },
    match: { type: Object, required: true },
    competition: { type: String },
    status: { type: String },
    updated_at: { type: Date }
}, { collection: 'suggested_matches' });

module.exports = mongoose.model('SuggestedMatch', SuggestedMatchSchema);