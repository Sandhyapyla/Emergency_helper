const express = require("express");
const router = express.Router();
const Service = require("../models/Service");

// POST: Report a new emergency service
router.post("/", async (req, res) => {
    try {
        const { name, type, contact, availability, address } = req.body;

        const newService = new Service({ name, type, address, contact, availability });
        const savedService = await newService.save();

        if (!savedService) {
            return res.status(400).json({ message: "Failed to save service" });
        }

        res.status(201).json({ message: "Service reported successfully!", service: savedService });
    } catch (error) {
        console.error("Error saving service:", error);
        res.status(500).json({ message: "Failed to save service", error: error.message });
    }
});

// GET: Fetch all emergency services
router.get("/", async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ message: "Failed to fetch services", error: error.message });
    }
});

module.exports = router;
