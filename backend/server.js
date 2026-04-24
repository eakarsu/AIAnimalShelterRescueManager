const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const authRoutes = require('./routes/auth');
const animalsRoutes = require('./routes/animals');
const kennelsRoutes = require('./routes/kennels');
const medicalRoutes = require('./routes/medical');
const behavioralRoutes = require('./routes/behavioral');
const adoptionsRoutes = require('./routes/adoptions');
const fostersRoutes = require('./routes/fosters');
const volunteersRoutes = require('./routes/volunteers');
const donationsRoutes = require('./routes/donations');
const inventoryRoutes = require('./routes/inventory');
const lostfoundRoutes = require('./routes/lostfound');
const strayholdsRoutes = require('./routes/strayholds');
const eventsRoutes = require('./routes/events');
const medicationsRoutes = require('./routes/medications');
const quarantineRoutes = require('./routes/quarantine');
const aiRoutes = require('./routes/ai');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/animals', animalsRoutes);
app.use('/api/kennels', kennelsRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/behavioral', behavioralRoutes);
app.use('/api/adoptions', adoptionsRoutes);
app.use('/api/fosters', fostersRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/lostfound', lostfoundRoutes);
app.use('/api/strayholds', strayholdsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/quarantine', quarantineRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AI Animal Shelter Backend running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;
