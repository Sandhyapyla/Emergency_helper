const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Contact = require("../models/Contact");

// Handle contact form submissions
router.post("/", async (req, res) => {
    try {
        // Check MongoDB connection status
        if (!mongoose.connection.readyState) {
            console.warn('MongoDB is not connected');
            return res.status(503).json({
                message: "Database connection unavailable",
                stored: false
            });
        }

        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({
                message: "All fields are required",
                stored: false
            });
        }

        const newContact = new Contact({ name, email, message });
        const savedContact = await newContact.save();
        
        if (!savedContact) {
            throw new Error('Failed to save contact');
        }

        console.log('Contact saved successfully:', savedContact);
        res.status(201).json({ 
            message: "Message sent and stored successfully!",
            data: savedContact,
            stored: true
        });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ 
            message: error.message || "Error sending message", 
            error: error.message,
            stored: false
        });
    }
});

// Get all contact submissions (for admin purposes)
router.get("/", async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching contacts", error: error.message });
    }
});

module.exports = router;