const mongoose = require('mongoose');

const SuggestedMatchSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    match: {type: Object, required: true},
    flight: {type: Object, required: true},
    totalPrice: {type: Number, required: true}
}, {collection: 'suggested_matches'});

module.exports = mongoose.model('SuggestedMatch', SuggestedMatchSchema);