const express = require('express');
const router = express.Router();
const pool = require('../db');
const {
  generateAdoptionListing,
  analyzeBehavior,
  summarizeMedicalRecords,
  generateSocialMediaPost,
  generateFosterCommunication,
  generateDonationAppeal,
  matchAnimalToAdopter,
} = require('../services/ai');

// POST /api/ai/adoption-listing
router.post('/adoption-listing', async (req, res) => {
  try {
    const { animalId } = req.body;
    if (!animalId) {
      return res.status(400).json({ error: 'animalId is required' });
    }

    const result = await pool.query('SELECT * FROM animals WHERE id = $1', [animalId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const listing = await generateAdoptionListing(result.rows[0]);
    res.json({ listing });
  } catch (error) {
    console.error('Adoption listing error:', error);
    res.status(500).json({ error: 'Failed to generate adoption listing' });
  }
});

// POST /api/ai/behavior-analysis
router.post('/behavior-analysis', async (req, res) => {
  try {
    const { assessmentId } = req.body;
    if (!assessmentId) {
      return res.status(400).json({ error: 'assessmentId is required' });
    }

    const result = await pool.query(
      `SELECT ba.*, a.name as animal_name FROM behavioral_assessments ba
       LEFT JOIN animals a ON ba.animal_id = a.id WHERE ba.id = $1`,
      [assessmentId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const analysis = await analyzeBehavior(result.rows[0]);
    res.json({ analysis });
  } catch (error) {
    console.error('Behavior analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze behavior' });
  }
});

// POST /api/ai/medical-summary
router.post('/medical-summary', async (req, res) => {
  try {
    const { animalId } = req.body;
    if (!animalId) {
      return res.status(400).json({ error: 'animalId is required' });
    }

    const result = await pool.query(
      'SELECT * FROM medical_records WHERE animal_id = $1 ORDER BY record_date DESC',
      [animalId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No medical records found for this animal' });
    }

    const summary = await summarizeMedicalRecords(result.rows);
    res.json({ summary });
  } catch (error) {
    console.error('Medical summary error:', error);
    res.status(500).json({ error: 'Failed to summarize medical records' });
  }
});

// POST /api/ai/social-media
router.post('/social-media', async (req, res) => {
  try {
    const { animalId } = req.body;
    if (!animalId) {
      return res.status(400).json({ error: 'animalId is required' });
    }

    const result = await pool.query('SELECT * FROM animals WHERE id = $1', [animalId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const post = await generateSocialMediaPost(result.rows[0]);
    res.json({ post });
  } catch (error) {
    console.error('Social media post error:', error);
    res.status(500).json({ error: 'Failed to generate social media post' });
  }
});

// POST /api/ai/foster-communication
router.post('/foster-communication', async (req, res) => {
  try {
    const { placementId, type } = req.body;
    if (!placementId || !type) {
      return res.status(400).json({ error: 'placementId and type are required' });
    }

    const result = await pool.query(
      `SELECT fp.*, a.name as animal_name, fh.foster_name, fh.email as foster_email
       FROM foster_placements fp
       LEFT JOIN animals a ON fp.animal_id = a.id
       LEFT JOIN foster_homes fh ON fp.foster_home_id = fh.id
       WHERE fp.id = $1`,
      [placementId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Placement not found' });
    }

    const communication = await generateFosterCommunication(result.rows[0], type);
    res.json({ communication });
  } catch (error) {
    console.error('Foster communication error:', error);
    res.status(500).json({ error: 'Failed to generate foster communication' });
  }
});

// POST /api/ai/donation-appeal
router.post('/donation-appeal', async (req, res) => {
  try {
    const { campaign } = req.body;
    if (!campaign) {
      return res.status(400).json({ error: 'campaign is required' });
    }

    const totalAnimals = await pool.query('SELECT COUNT(*) as count FROM animals');
    const adoptedAnimals = await pool.query("SELECT COUNT(*) as count FROM animals WHERE status = 'adopted'");
    const donationStats = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as donor_count FROM donations WHERE campaign = $1',
      [campaign]
    );

    const totalCount = parseInt(totalAnimals.rows[0].count);
    const adoptedCount = parseInt(adoptedAnimals.rows[0].count);
    const adoptionRate = totalCount > 0 ? ((adoptedCount / totalCount) * 100).toFixed(1) + '%' : 'N/A';

    const stats = {
      totalAnimals: totalCount,
      adoptionRate,
      fundingGoal: 'TBD',
      amountRaised: '$' + parseFloat(donationStats.rows[0].total).toFixed(2),
      donorCount: donationStats.rows[0].donor_count,
      context: `Campaign: ${campaign}`,
    };

    const appeal = await generateDonationAppeal(campaign, stats);
    res.json({ appeal });
  } catch (error) {
    console.error('Donation appeal error:', error);
    res.status(500).json({ error: 'Failed to generate donation appeal' });
  }
});

// POST /api/ai/match-animal
router.post('/match-animal', async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required' });
    }

    const appResult = await pool.query('SELECT * FROM adoption_applications WHERE id = $1', [applicationId]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const animalsResult = await pool.query("SELECT * FROM animals WHERE status = 'available' ORDER BY name");

    const match = await matchAnimalToAdopter(appResult.rows[0], animalsResult.rows);
    res.json({ match });
  } catch (error) {
    console.error('Match animal error:', error);
    res.status(500).json({ error: 'Failed to match animal to adopter' });
  }
});

module.exports = router;
