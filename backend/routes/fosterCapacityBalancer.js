const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { open_fosters: 24, urgent_placements: 7, species_mismatches: 3, capacity_gain: 11 },
    placements: [
      { animal: 'A-1042 Luna', need: 'quiet adult home', foster: 'Garcia household', fit_score: 94, action: 'place today' },
      { animal: 'A-1099 Milo', need: 'bottle-feeding', foster: 'Kim household', fit_score: 88, action: 'confirm supplies' },
      { animal: 'A-1118 Pepper', need: 'single-dog home', foster: 'Waitlist', fit_score: 63, action: 'recruit targeted foster' },
    ],
  });
});

router.post('/match', (req, res) => {
  const { animal = 'animal', species = 'dog', medical = false } = req.body || {};
  res.json({
    animal,
    species,
    recommended_foster: medical ? 'medical foster pool' : 'standard foster pool',
    checklist: ['capacity confirmed', 'species fit checked', 'supplies assigned'],
  });
});

module.exports = router;
