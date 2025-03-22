const express = require("express");
const router = express.Router();
const Review = require("../models/Review");

// Submit a new review
router.post("/", async (req, res) => {
    try {
        const { name, rating, comment, serviceType, serviceName, serviceId } = req.body;
        const newReview = new Review({
            name,
            rating,
            comment,
            serviceType,
            serviceName,
            serviceId
        });
        await newReview.save();
        res.status(201).json({ message: "Review submitted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error submitting review", error: error.message });
    }
});

// Get all reviews
router.get("/", async (req, res) => {
    try {
        const { serviceType, serviceId } = req.query;
        const query = {};
        
        if (serviceType) query.serviceType = serviceType;
        if (serviceId) query.serviceId = serviceId;
        
        const reviews = await Review.find(query).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error: error.message });
    }
});

// Get review statistics for a service
router.get("/stats", async (req, res) => {
    try {
        const { serviceType, serviceId } = req.query;
        const query = {};
        
        if (serviceType) query.serviceType = serviceType;
        if (serviceId) query.serviceId = serviceId;
        
        const reviews = await Review.find(query);
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
            : 0;
            
        res.json({
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(1))
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching review statistics", error: error.message });
    }
});

module.exports = router;