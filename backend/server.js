require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const User = require('./models/User');
const Organizer = require('./models/Organizer');

// Route imports
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const organizerRoutes = require('./routes/organizerRoutes');
const participantRoutes = require('./routes/participantRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const forumRoutes = require('./routes/forumRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forum', forumRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    }
});

// Socket.IO: authenticate connection via JWT
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let user;
        if (decoded.role === 'organizer') {
            user = await Organizer.findById(decoded.id).select('-password');
            if (user) user.role = 'organizer';
        } else {
            user = await User.findById(decoded.id).select('-password');
            if (user) {
                // Explicitly set role for admin/participant if missing from model for some reason
                user.role = decoded.role || 'participant';
            }
        }

        if (!user) return next(new Error('User not found'));

        // Final fallback for role detection
        if (user.organizerName) {
            user.role = 'organizer';
        }

        socket.user = user;
        console.log(`Socket connected: ${user.role} (${user._id})`);
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

// Socket.IO: forum rooms
io.on('connection', (socket) => {
    // Join a forum room for a specific event
    socket.on('join-forum', (eventId) => {
        socket.join(`forum:${eventId}`);
    });

    // Leave a forum room
    socket.on('leave-forum', (eventId) => {
        socket.leave(`forum:${eventId}`);
    });

    // Send a new message — persist & broadcast
    socket.on('send-message', async (data) => {
        try {
            const { eventId, content } = data;
            if (!eventId || !content?.trim()) return;

            const Message = require('./models/Message');
            const user = socket.user;

            const isOrganizer = user.role === 'organizer';
            const senderName = isOrganizer
                ? user.organizerName
                : `${user.firstName} ${user.lastName}`;

            const msg = await Message.create({
                eventId,
                userId: isOrganizer ? null : user._id,
                organizerId: isOrganizer ? user._id : null,
                senderName,
                senderRole: isOrganizer ? 'organizer' : 'participant',
                content: content.trim()
            });

            io.to(`forum:${eventId}`).emit('new-message', {
                _id: msg._id,
                senderName: msg.senderName,
                senderRole: msg.senderRole,
                content: msg.content,
                isPinned: msg.isPinned,
                createdAt: msg.createdAt
            });
        } catch (err) {
            console.error('Socket send-message error:', err.message);
        }
    });

    socket.on('disconnect', () => { });
});

// Export io so routes can use it for pin/delete broadcasts
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
