const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
    name: String,
    type: String,
    address: String,
    contact: String,
    availability: String
}, { timestamps: true });

module.exports = mongoose.model("Service", ServiceSchema);
