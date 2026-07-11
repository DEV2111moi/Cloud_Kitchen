const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const homeCookRoutes = require('./routes/homeCookRoutes');
const customerRoutes = require('./routes/customerRoutes');
const deliveryPartnerRoutes = require('./routes/deliveryPartnerRoutes');
const publicRoutes = require('./routes/publicRoutes');
const cookRoutes = require('./routes/cookRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Store active connections: userId -> socketId
const activeSockets = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join', (userId) => {
    activeSockets.set(userId, socket.id);
    console.log(`👤 User joined mapping: ${userId}`);
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of activeSockets.entries()) {
      if (socketId === socket.id) {
        activeSockets.delete(userId);
        console.log(`👤 User disconnected: ${userId}`);
        break;
      }
    }
  });
});

app.set('io', io);
app.set('activeSockets', activeSockets);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/home-cooks', homeCookRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/delivery-partners', deliveryPartnerRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/cook', cookRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Cloud Kitchen API is running' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});
