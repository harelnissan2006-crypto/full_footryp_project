const mongoose = require('mongoose');

const packageCacheSchema = new mongoose.Schema({
    cacheKey: {type: String, required: true, unique: true},
    hotels: [{type: Object}],
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('PackageCache', packageCacheSchema);