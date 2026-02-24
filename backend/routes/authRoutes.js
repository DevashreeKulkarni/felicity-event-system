const express = require('express');
const router = express.Router();
const { registerParticipant, login, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const axios = require('axios');

router.post('/register', registerParticipant);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

router.post('/verify-turnstile', async (req, res) => {
    try {
        const { token } = req.body;
        const response = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        if (response.data.success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: 'CAPTCHA verification failed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

