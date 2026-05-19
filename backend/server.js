const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5273', 'http://localhost:8401'],
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

// Custom Shelter Views (registered before 404 handler)
app.use('/api/custom-views', require('./routes/customViews'));

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

// BATCH_00_AUDIT_MOUNTS
app.use('/api/breed-id', require('./routes/breedId'));
app.use('/api/adopter-match', require('./routes/adopterMatch'));
app.use('/api/return-prevention', require('./routes/returnPrevention'));
app.use('/api/volunteer-scheduler', require('./routes/volunteerScheduler'));
app.use('/api/microchip-registry', require('./routes/microchipRegistry'));

// === Batch 00 Gaps & Frontend Mounts ===
app.use('/api/gap-ai-breed-identification-photo', require('./routes/gap_ai_breed_identification_photo'));
app.use('/api/gap-ai-health-risk-prediction-behavioral', require('./routes/gap_ai_health_risk_prediction_behavioral'));
app.use('/api/gap-ai-volunteer-show-prediction', require('./routes/gap_ai_volunteer_show_prediction'));
app.use('/api/gap-microchip-registry-integration-akc-homeagain', require('./routes/gap_microchip_registry_integration_akc_homeagain'));
app.use('/api/gap-gps-collar-tracking', require('./routes/gap_gps_collar_tracking'));
app.use('/api/gap-structured-training-session-progress-tracking', require('./routes/gap_structured_training_session_progress_tracking'));
app.use('/api/gap-notifications-subsystem', require('./routes/gap_notifications_subsystem'));
app.use('/api/gap-outbound-webhooks', require('./routes/gap_outbound_webhooks'));
app.use('/api/gap-public-adoption-portal', require('./routes/gap_public_adoption_portal'));
