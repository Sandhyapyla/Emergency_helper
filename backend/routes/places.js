const express = require("express");
const axios = require("axios");
const Review = require("../models/Review");
require("dotenv").config();

const router = express.Router();

// Google Places API Key
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Function to get emergency services (hospitals, police, fire stations)
const getEmergencyServices = async (latitude, longitude, type) => {
  console.log(`Fetching ${type} services for coordinates: ${latitude}, ${longitude}`);
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${latitude},${longitude}`,
          radius: 5000, // 5km radius
          type: type, // hospital, police, fire_station
          key: GOOGLE_API_KEY,
          rankby: 'distance',
          sensor: true
        },
      }
    );
    
    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error(`Places API Error - Status: ${response.data.status}, Message: ${response.data.error_message || 'No error message'}`);
      throw new Error(`Google Places API Error: ${response.data.status}`);
    }

    console.log(`Found ${response.data.results.length} ${type} services`);
    return response.data.results;
  } catch (error) {
    console.error(`Error fetching ${type} data from Google Places API:`, error);
    throw error;
  }
};

// Route to get real-time emergency services
router.get("/services", async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }

  try {
    console.log(`Processing request for coordinates: ${latitude}, ${longitude}`);
    
    const [hospitals, policeStations, fireStations] = await Promise.all([
      getEmergencyServices(latitude, longitude, "hospital"),
      getEmergencyServices(latitude, longitude, "police"),
      getEmergencyServices(latitude, longitude, "fire_station")
    ]);

    const totalServices = hospitals.length + policeStations.length + fireStations.length;
    console.log(`Total services found: ${totalServices}`);

    if (totalServices === 0) {
      return res.status(404).json({
        error: "No emergency services found in the specified area",
        data: { hospitals: [], policeStations: [], fireStations: [] }
      });
    }

    // Get review statistics for all services
    const servicesWithReviews = await Promise.all([
      ...hospitals.map(async (hospital) => {
        const stats = await Review.aggregate([
          { $match: { serviceId: hospital.place_id, serviceType: 'hospital' } },
          { $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }}
        ]);
        return { ...hospital, reviewStats: stats[0] || { averageRating: 0, totalReviews: 0 } };
      }),
      ...policeStations.map(async (station) => {
        const stats = await Review.aggregate([
          { $match: { serviceId: station.place_id, serviceType: 'police' } },
          { $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }}
        ]);
        return { ...station, reviewStats: stats[0] || { averageRating: 0, totalReviews: 0 } };
      }),
      ...fireStations.map(async (station) => {
        const stats = await Review.aggregate([
          { $match: { serviceId: station.place_id, serviceType: 'fire_station' } },
          { $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }}
        ]);
        return { ...station, reviewStats: stats[0] || { averageRating: 0, totalReviews: 0 } };
      })
    ]);

    const [hospitalsWithReviews, policeWithReviews, fireWithReviews] = [
      servicesWithReviews.slice(0, hospitals.length),
      servicesWithReviews.slice(hospitals.length, hospitals.length + policeStations.length),
      servicesWithReviews.slice(hospitals.length + policeStations.length)
    ];

    res.json({
      hospitals: hospitalsWithReviews,
      policeStations: policeWithReviews,
      fireStations: fireWithReviews,
      total: totalServices
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch emergency services" });
  }
});

module.exports = router;
