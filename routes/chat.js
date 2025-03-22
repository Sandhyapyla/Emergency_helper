const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

// Service health check endpoint
router.get('/health', async (req, res) => {
    try {
        if (!genAI || !model) {
            throw new Error('Gemini AI service not initialized');
        }
        // Verify API connection with a minimal request
        const chat = model.startChat();
        await chat.sendMessage('test');
        res.json({ status: 'ok', message: 'Chat service is running' });
    } catch (error) {
        console.error('❌ Health Check Failed:', error);
        res.status(503).json({
            status: 'error',
            message: 'Chat service is unavailable',
            details: error.message
        });
    }
});

// Initialize Gemini AI client
let genAI;
let model;

try {
    if (!config.geminiApiKey) {
        console.error('❌ Gemini API key is missing. Please check your .env file.');
        throw new Error('Gemini API key is not configured.');
    }
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('✅ Gemini AI initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error);
}

// Chat context for emergency assistance
const CHAT_CONTEXT = 'You are an Emergency Services Assistant. Your task is to provide clear, concise guidance on emergency situations such as medical emergencies, fire, and natural disasters.';

// Chat endpoint
router.post('/', async (req, res) => {
    console.log('📩 Received request:', req.body);

    try {
        const { message } = req.body;

        if (!message) {
            console.log('⚠️ Missing message in request');
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!model || !genAI) {
            console.error('❌ Gemini AI is not properly initialized');
            return res.status(503).json({
                error: 'Chat service is temporarily unavailable',
                details: 'AI service is not properly configured'
            });
        }

        // Start a chat session with context
        const chat = model.startChat({
            history: [{
                role: 'user',
                parts: CHAT_CONTEXT
            }]
        });

        // Send user message and get response
        const result = await chat.sendMessage(message);
        const response = result.response.text();

        console.log('✅ Gemini response:', response);
        res.json({ response });

    } catch (error) {
        console.error('❌ Chat API Error:', error);
        res.status(503).json({
            error: 'Chat service is temporarily unavailable',
            details: error.message
        });
    }
});

module.exports = router;

module.exports = router;
