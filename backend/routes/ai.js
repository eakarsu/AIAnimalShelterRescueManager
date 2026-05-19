const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const {
  generateAdoptionListing,
  analyzeBehavior,
  summarizeMedicalRecords,
  generateSocialMediaPost,
  generateFosterCommunication,
  generateDonationAppeal,
  matchAnimalToAdopter,
  callOpenRouter,
} = require('../services/ai');

// ─── Rate limiter: 20 AI requests per user per hour ────────────────────────
// Keyed by JWT user ID — avoids IPv6 address validation issues.
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `user_${req.user?.id || 'anon'}`,
  message: { error: 'Too many AI requests. Limit is 20 per hour per user.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
});

// Helper: validate positive integer
function validatePositiveInt(value, fieldName) {
  const parsed = parseInt(value, 10);
  if (!value || isNaN(parsed) || parsed < 1 || String(parsed) !== String(value)) {
    return `${fieldName} must be a positive integer`;
  }
  return null;
}

// POST /api/ai/adoption-listing
router.post('/adoption-listing', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { animalId } = req.body;
    const err = validatePositiveInt(animalId, 'animalId');
    if (err) return res.status(400).json({ error: err });

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
router.post('/behavior-analysis', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const err = validatePositiveInt(assessmentId, 'assessmentId');
    if (err) return res.status(400).json({ error: err });

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
router.post('/medical-summary', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { animalId } = req.body;
    const err = validatePositiveInt(animalId, 'animalId');
    if (err) return res.status(400).json({ error: err });

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
router.post('/social-media', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { animalId } = req.body;
    const err = validatePositiveInt(animalId, 'animalId');
    if (err) return res.status(400).json({ error: err });

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
router.post('/foster-communication', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { placementId, type } = req.body;
    if (!placementId || !type) {
      return res.status(400).json({ error: 'placementId and type are required' });
    }
    const err = validatePositiveInt(placementId, 'placementId');
    if (err) return res.status(400).json({ error: err });

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
router.post('/donation-appeal', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { campaign } = req.body;
    if (!campaign || typeof campaign !== 'string' || campaign.trim() === '') {
      return res.status(400).json({ error: 'campaign is required and must be a non-empty string' });
    }

    const totalAnimals = await pool.query('SELECT COUNT(*) as count FROM animals');
    const adoptedAnimals = await pool.query("SELECT COUNT(*) as count FROM animals WHERE status = 'adopted'");
    const donationStats = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as donor_count FROM donations WHERE campaign = $1',
      [campaign.trim()]
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
// Returns structured JSON with top 3 matches and compatibility scores
router.post('/match-animal', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { applicationId } = req.body;
    const err = validatePositiveInt(applicationId, 'applicationId');
    if (err) return res.status(400).json({ error: err });

    // Validate application exists
    const appResult = await pool.query('SELECT * FROM adoption_applications WHERE id = $1', [applicationId]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const application = appResult.rows[0];

    // Validate adopter has required preference fields
    const animalsResult = await pool.query("SELECT * FROM animals WHERE status = 'available' ORDER BY name");

    // Build structured prompt that demands JSON output
    const systemPrompt = `You are an expert adoption counselor at an animal shelter. You MUST respond with valid JSON only — no markdown, no explanation outside the JSON structure.`;

    const animalsText = animalsResult.rows.map(a =>
      `{"id":${a.id},"name":"${a.name}","species":"${a.species}","breed":"${a.breed || 'Mixed'}","age_years":${a.age_years},"age_months":${a.age_months},"weight":${a.weight || 0},"sex":"${a.sex}","description":"${(a.description || '').replace(/"/g, "'")}","status":"${a.status}"}`
    ).join(',');

    const userPrompt = `Match the top 3 animals for this adopter. Return ONLY a JSON object:
{
  "top_matches": [
    {"rank": 1, "animal_id": <number>, "animal_name": "<string>", "compatibility_score": <0-100>, "reason": "<string>"},
    {"rank": 2, "animal_id": <number>, "animal_name": "<string>", "compatibility_score": <0-100>, "reason": "<string>"},
    {"rank": 3, "animal_id": <number>, "animal_name": "<string>", "compatibility_score": <0-100>, "reason": "<string>"}
  ],
  "summary": "<brief overall recommendation>"
}

Adopter profile:
- Name: ${application.applicant_name}
- Housing: ${application.housing_type}
- Has Yard: ${application.has_yard}
- Has Other Pets: ${application.has_other_pets} ${application.other_pets_details ? `(${application.other_pets_details})` : ''}
- Has Children: ${application.has_children} ${application.children_ages ? `(Ages: ${application.children_ages})` : ''}
- Experience: ${application.experience}
- Preferred Species: ${application.preferred_species || 'any'}
- Preferred Size: ${application.preferred_size || 'any'}
- Reason for adopting: ${application.reason}

Available animals: [${animalsText}]`;

    const rawResponse = await callOpenRouter(systemPrompt, userPrompt);

    let structured;
    try {
      // Strip markdown code fences if present
      const cleaned = rawResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      structured = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, return the raw response with a warning
      structured = { raw_response: rawResponse, parse_error: 'AI did not return valid JSON' };
    }

    res.json({
      application_id: applicationId,
      adopter_name: application.applicant_name,
      match: structured,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Match animal error:', error);
    res.status(500).json({ error: 'Failed to match animal to adopter' });
  }
});

// POST /api/ai/compatibility-check
router.post('/compatibility-check', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { new_animal_id, existing_animal_ids } = req.body;

    const newErr = validatePositiveInt(new_animal_id, 'new_animal_id');
    if (newErr) return res.status(400).json({ error: newErr });

    if (!Array.isArray(existing_animal_ids) || existing_animal_ids.length === 0) {
      return res.status(400).json({ error: 'existing_animal_ids must be a non-empty array of positive integers' });
    }

    for (const id of existing_animal_ids) {
      const idErr = validatePositiveInt(id, 'existing_animal_ids element');
      if (idErr) return res.status(400).json({ error: idErr });
    }

    // Ensure compatibility_checks table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compatibility_checks (
        id SERIAL PRIMARY KEY,
        new_animal_id INTEGER NOT NULL,
        existing_animal_ids INTEGER[] NOT NULL,
        compatibility_scores JSONB,
        ai_assessment TEXT,
        checked_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Fetch the new animal
    const newAnimalResult = await pool.query(
      `SELECT a.*, ba.aggression_level, ba.fear_level, ba.sociability_level, ba.energy_level,
              ba.good_with_dogs, ba.good_with_cats, ba.bite_history, ba.overall_rating
       FROM animals a
       LEFT JOIN behavioral_assessments ba ON ba.animal_id = a.id
       WHERE a.id = $1
       ORDER BY ba.assessment_date DESC
       LIMIT 1`,
      [new_animal_id]
    );
    if (newAnimalResult.rows.length === 0) {
      return res.status(404).json({ error: 'New animal not found' });
    }
    const newAnimal = newAnimalResult.rows[0];

    // Fetch existing animals with behavioral data
    const existingResult = await pool.query(
      `SELECT a.*, ba.aggression_level, ba.fear_level, ba.sociability_level, ba.energy_level,
              ba.good_with_dogs, ba.good_with_cats, ba.bite_history, ba.overall_rating
       FROM animals a
       LEFT JOIN behavioral_assessments ba ON ba.animal_id = a.id
       WHERE a.id = ANY($1::int[])
       ORDER BY ba.assessment_date DESC`,
      [existing_animal_ids]
    );

    const systemPrompt = `You are a certified animal behaviorist specializing in inter-animal compatibility assessments. You MUST respond with valid JSON only.`;

    const userPrompt = `Assess compatibility between the new animal and each existing animal. Return ONLY this JSON:
{
  "compatibility_scores": [
    {"animal_id": <number>, "animal_name": "<string>", "score": <0-100>, "risk_level": "low|medium|high", "notes": "<string>"}
  ],
  "overall_recommendation": "<string>",
  "introduction_protocol": "<string>"
}

New Animal:
${JSON.stringify(newAnimal, null, 2)}

Existing Animals:
${JSON.stringify(existingResult.rows, null, 2)}`;

    const rawResponse = await callOpenRouter(systemPrompt, userPrompt);

    let structured;
    try {
      const cleaned = rawResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      structured = JSON.parse(cleaned);
    } catch {
      structured = { raw_response: rawResponse, parse_error: 'AI did not return valid JSON' };
    }

    // Save to database
    const saved = await pool.query(`
      INSERT INTO compatibility_checks (new_animal_id, existing_animal_ids, compatibility_scores, ai_assessment, checked_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [
      new_animal_id,
      existing_animal_ids,
      JSON.stringify(structured),
      rawResponse,
    ]);

    res.json({
      new_animal: { id: newAnimal.id, name: newAnimal.name, species: newAnimal.species },
      existing_animals_checked: existingResult.rows.map((a) => ({ id: a.id, name: a.name })),
      result: structured,
      saved_record_id: saved.rows[0].id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Compatibility check error:', error);
    res.status(500).json({ error: 'Failed to perform compatibility check' });
  }
});

// POST /api/ai/breed-id-from-description
// Audit-recommended: AI breed identification (text-based version; photo-based version requires upload pipeline)
router.post('/breed-id-from-description', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { description, species, weight_lbs, age_years, color, observed_traits } = req.body;
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'description is required and must be a string' });
    }
    if (description.length > 4000) {
      return res.status(400).json({ error: 'description must be under 4000 characters' });
    }

    const systemPrompt = `You are a certified veterinary breed-identification specialist. Given a free-form description of an animal (and optional measurements), identify the most likely breed or breed mix, list common health predispositions, and suggest care requirements. Respond ONLY with valid JSON (no markdown fences):
{
  "primary_breed": "string",
  "primary_breed_confidence": number,
  "likely_mix": [
    { "breed": "string", "estimated_percent": number }
  ],
  "alternative_breed_guesses": [
    { "breed": "string", "confidence": number, "reasoning": "string" }
  ],
  "common_health_concerns": ["string"],
  "typical_temperament": ["string"],
  "exercise_needs": "Low|Medium|High|Very High",
  "grooming_needs": "Low|Medium|High",
  "good_with_children": "Yes|No|With Supervision|Unknown",
  "good_with_other_pets": "Yes|No|With Caution|Unknown",
  "estimated_adult_weight_lbs": number,
  "expected_lifespan_years": number,
  "care_recommendations": ["string", "string"],
  "confidence_score": number,
  "disclaimer": "Visual breed ID is the gold standard; this is a text-based estimate."
}`;

    const userPrompt = `Description:
${description}

Optional measurements:
- species: ${species || 'unspecified'}
- weight_lbs: ${weight_lbs ?? 'unknown'}
- age_years: ${age_years ?? 'unknown'}
- color: ${color || 'unspecified'}
- observed_traits: ${observed_traits ? JSON.stringify(observed_traits) : 'none'}`;

    const rawResponse = await callOpenRouter(systemPrompt, userPrompt);
    let structured;
    try {
      const stripped = rawResponse.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
      structured = JSON.parse(stripped);
    } catch {
      structured = { raw_response: rawResponse, parse_error: 'AI did not return valid JSON' };
    }

    res.json({
      result: structured,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Breed ID error:', error);
    res.status(500).json({ error: 'Failed to identify breed' });
  }
});

// POST /api/ai/volunteer-no-show
// Apply-pass-5: AI volunteer no-show prediction (audit backlog)
// Uses existing volunteer_schedules table to estimate no-show risk for an upcoming shift.
// Body: { volunteer_id?, schedule_id? } — provide one or both. Returns 503 if no key.
router.post('/volunteer-no-show', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI not configured.', missing: 'OPENROUTER_API_KEY' });
    }
    const { volunteer_id, schedule_id } = req.body || {};
    if (!volunteer_id && !schedule_id) {
      return res.status(400).json({ error: 'volunteer_id or schedule_id required' });
    }

    let volunteer = null;
    let schedule = null;
    if (schedule_id) {
      const sErr = validatePositiveInt(schedule_id, 'schedule_id');
      if (sErr) return res.status(400).json({ error: sErr });
      const sRes = await pool.query(
        `SELECT vs.*, v.id AS v_id, v.name AS volunteer_name, v.email, v.phone, v.skills, v.availability, v.status AS volunteer_status
         FROM volunteer_schedules vs LEFT JOIN volunteers v ON vs.volunteer_id = v.id WHERE vs.id = $1`,
        [schedule_id]
      );
      if (sRes.rows.length === 0) return res.status(404).json({ error: 'Schedule not found' });
      schedule = sRes.rows[0];
      volunteer = {
        id: schedule.v_id, name: schedule.volunteer_name, email: schedule.email,
        phone: schedule.phone, skills: schedule.skills, availability: schedule.availability,
        status: schedule.volunteer_status,
      };
    } else {
      const vErr = validatePositiveInt(volunteer_id, 'volunteer_id');
      if (vErr) return res.status(400).json({ error: vErr });
      const vRes = await pool.query('SELECT * FROM volunteers WHERE id = $1', [volunteer_id]);
      if (vRes.rows.length === 0) return res.status(404).json({ error: 'Volunteer not found' });
      volunteer = vRes.rows[0];
    }

    // Pull last 30 schedules for history-based reasoning
    const histRes = await pool.query(
      `SELECT scheduled_date, start_time, status, task FROM volunteer_schedules
       WHERE volunteer_id = $1 ORDER BY scheduled_date DESC LIMIT 30`,
      [volunteer.id]
    );
    const history = histRes.rows;
    const totalShifts = history.length;
    const noShowCount = history.filter(h => /no.?show|missed|cancelled|cancel/i.test(h.status || '')).length;
    const baseRate = totalShifts > 0 ? noShowCount / totalShifts : 0;

    const systemPrompt = `You are a volunteer-program operations analyst. Predict the probability that a volunteer will miss an upcoming scheduled shift, identify drivers, and recommend retention/reminder actions. Respond ONLY with valid JSON (no markdown fences):
{
  "no_show_probability": number,
  "risk_level": "Low|Medium|High|Very High",
  "primary_drivers": [{ "factor": "string", "weight": number, "explanation": "string" }],
  "recommended_actions": ["string"],
  "suggested_reminder_cadence": "string",
  "confidence_score": number,
  "historical_base_rate": number,
  "notes": "string"
}`;
    const userPrompt = `Volunteer profile:
${JSON.stringify(volunteer, null, 2)}

Upcoming shift:
${schedule ? JSON.stringify({ scheduled_date: schedule.scheduled_date, start_time: schedule.start_time, end_time: schedule.end_time, task: schedule.task, area: schedule.area, status: schedule.status, notes: schedule.notes }, null, 2) : 'unspecified'}

Historical schedule statuses (last 30):
- total_past_shifts: ${totalShifts}
- past_no_shows_or_cancellations: ${noShowCount}
- historical_base_rate: ${baseRate.toFixed(3)}
- recent_records: ${JSON.stringify(history.slice(0, 10))}

Predict no-show risk.`;

    const rawResponse = await callOpenRouter(systemPrompt, userPrompt);
    let structured;
    try {
      const stripped = rawResponse.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
      structured = JSON.parse(stripped);
    } catch {
      structured = { raw_response: rawResponse, parse_error: 'AI did not return valid JSON' };
    }
    res.json({
      volunteer: { id: volunteer.id, name: volunteer.name },
      schedule: schedule ? { id: schedule.id, scheduled_date: schedule.scheduled_date, task: schedule.task } : null,
      historical: { total_past_shifts: totalShifts, past_no_shows: noShowCount, base_rate: baseRate },
      result: structured,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Volunteer no-show error:', error);
    if (/OPENROUTER_API_KEY|api[_ ]?key|401|403/i.test(error.message || '')) {
      return res.status(503).json({ error: 'AI not configured.', missing: 'OPENROUTER_API_KEY' });
    }
    res.status(500).json({ error: 'Failed to predict no-show risk' });
  }
});

// POST /api/ai/longitudinal-health-risk
// Apply-pass-5: AI longitudinal health risk prediction from medical history
// PRODUCT-DECISION: defaults to 365-day lookback, includes all medical record types.
// Body: { animalId, lookback_days? }
router.post('/longitudinal-health-risk', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI not configured.', missing: 'OPENROUTER_API_KEY' });
    }
    const { animalId, lookback_days } = req.body || {};
    const err = validatePositiveInt(animalId, 'animalId');
    if (err) return res.status(400).json({ error: err });
    // PRODUCT-DECISION: default lookback window is 365 days, capped at 1825 (5 years)
    const window = Math.min(Math.max(parseInt(lookback_days, 10) || 365, 30), 1825);

    const animalRes = await pool.query('SELECT * FROM animals WHERE id = $1', [animalId]);
    if (animalRes.rows.length === 0) return res.status(404).json({ error: 'Animal not found' });
    const animal = animalRes.rows[0];

    const recRes = await pool.query(
      `SELECT record_date, record_type, description, veterinarian, next_due_date, notes
       FROM medical_records
       WHERE animal_id = $1 AND record_date >= (CURRENT_DATE - ($2::int || ' days')::interval)
       ORDER BY record_date ASC`,
      [animalId, window]
    );
    const records = recRes.rows;

    const systemPrompt = `You are a senior shelter veterinarian. Given an animal profile and its longitudinal medical history, predict near-term and long-term health risks, suggest preventive care, and flag concerning patterns. Respond ONLY with valid JSON (no markdown fences):
{
  "overall_risk_score": number,
  "risk_level": "Low|Medium|High|Very High",
  "predicted_conditions": [{ "condition": "string", "likelihood": number, "timeframe": "weeks|months|1-3 years|3+ years", "supporting_evidence": "string" }],
  "concerning_patterns": ["string"],
  "preventive_recommendations": ["string"],
  "recommended_screenings": [{ "screening": "string", "due_in_days": number }],
  "diet_and_lifestyle_advice": ["string"],
  "confidence_score": number,
  "lookback_window_days": number,
  "records_analyzed": number
}`;
    const userPrompt = `Animal:
- name: ${animal.name}
- species: ${animal.species}
- breed: ${animal.breed}
- age_years: ${animal.age_years}
- weight_lbs: ${animal.weight}
- description: ${animal.description || 'n/a'}

Medical history (last ${window} days, ${records.length} records):
${records.map(r => `- ${r.record_date}: ${r.record_type} - ${r.description}${r.notes ? ' | notes: ' + r.notes : ''}${r.next_due_date ? ' | next_due: ' + r.next_due_date : ''}`).join('\n') || '(no records in window)'}

Predict longitudinal health risk and recommend preventive actions.`;
    const rawResponse = await callOpenRouter(systemPrompt, userPrompt);
    let structured;
    try {
      const stripped = rawResponse.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
      structured = JSON.parse(stripped);
    } catch {
      structured = { raw_response: rawResponse, parse_error: 'AI did not return valid JSON' };
    }
    res.json({
      animal: { id: animal.id, name: animal.name, species: animal.species, breed: animal.breed },
      lookback_days: window,
      records_analyzed: records.length,
      result: structured,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Longitudinal health risk error:', error);
    if (/OPENROUTER_API_KEY|api[_ ]?key|401|403/i.test(error.message || '')) {
      return res.status(503).json({ error: 'AI not configured.', missing: 'OPENROUTER_API_KEY' });
    }
    res.status(500).json({ error: 'Failed to predict longitudinal health risk' });
  }
});

// POST /api/ai/microchip-lookup
// Apply-pass-5: NEEDS-CREDS — gates on MICROCHIP_API_KEY env var.
// Real integrations: AKC Reunite, HomeAgain, AAHA universal lookup. This is a stub
// that returns 503 with `missing: MICROCHIP_API_KEY` until creds are configured.
// Documented env vars:
//   - MICROCHIP_API_KEY: vendor API key (e.g. AKC Reunite, HomeAgain)
//   - MICROCHIP_API_URL: vendor base URL (defaults to AAHA universal lookup)
router.post('/microchip-lookup', authMiddleware, async (req, res) => {
  try {
    if (!process.env.MICROCHIP_API_KEY) {
      return res.status(503).json({
        error: 'Microchip registry integration not configured.',
        missing: 'MICROCHIP_API_KEY',
        documentation: 'Set MICROCHIP_API_KEY (and optionally MICROCHIP_API_URL) to enable this feature.'
      });
    }
    const { microchip_id } = req.body || {};
    if (!microchip_id || typeof microchip_id !== 'string' || microchip_id.length < 8) {
      return res.status(400).json({ error: 'microchip_id (>=8 chars) is required' });
    }
    // Stub: real impl would call vendor here; left intentionally unimplemented.
    res.status(501).json({
      error: 'Microchip vendor call not implemented; credential is set, but adapter has not been wired.',
      microchip_id
    });
  } catch (error) {
    console.error('Microchip lookup error:', error);
    res.status(500).json({ error: 'Microchip lookup failed' });
  }
});

// ─── Training Sessions (TOO-RISKY-only-additive: CREATE TABLE IF NOT EXISTS) ────
// Apply-pass-5: behavioral training session tracking (audit backlog).
// New table created lazily on first request; existing data is untouched.
let trainingTableReady = false;
async function ensureTrainingTable() {
  if (trainingTableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS training_sessions (
      id SERIAL PRIMARY KEY,
      animal_id INT REFERENCES animals(id) ON DELETE CASCADE,
      trainer VARCHAR(255),
      session_date DATE,
      duration_minutes INT,
      skills_practiced TEXT[],
      goals TEXT,
      progress_notes TEXT,
      success_rating INT,
      next_steps TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  trainingTableReady = true;
}

// GET /api/ai/training-sessions?animal_id=...
router.get('/training-sessions', authMiddleware, async (req, res) => {
  try {
    await ensureTrainingTable();
    const { animal_id } = req.query;
    let q = 'SELECT ts.*, a.name AS animal_name FROM training_sessions ts LEFT JOIN animals a ON ts.animal_id = a.id';
    const params = [];
    if (animal_id) {
      const e = validatePositiveInt(animal_id, 'animal_id');
      if (e) return res.status(400).json({ error: e });
      params.push(animal_id);
      q += ' WHERE ts.animal_id = $1';
    }
    q += ' ORDER BY ts.session_date DESC, ts.id DESC';
    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (error) {
    console.error('Training sessions list error:', error);
    res.status(500).json({ error: 'Failed to list training sessions' });
  }
});

// POST /api/ai/training-sessions
router.post('/training-sessions', authMiddleware, async (req, res) => {
  try {
    await ensureTrainingTable();
    const { animal_id, trainer, session_date, duration_minutes, skills_practiced, goals, progress_notes, success_rating, next_steps } = req.body || {};
    const e = validatePositiveInt(animal_id, 'animal_id');
    if (e) return res.status(400).json({ error: e });
    const r = await pool.query(
      `INSERT INTO training_sessions
        (animal_id, trainer, session_date, duration_minutes, skills_practiced, goals, progress_notes, success_rating, next_steps)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        animal_id, trainer || null, session_date || null, duration_minutes || null,
        Array.isArray(skills_practiced) ? skills_practiced : (skills_practiced ? [skills_practiced] : null),
        goals || null, progress_notes || null,
        success_rating != null ? parseInt(success_rating, 10) : null,
        next_steps || null,
      ]
    );
    res.status(201).json(r.rows[0]);
  } catch (error) {
    console.error('Training session create error:', error);
    res.status(500).json({ error: 'Failed to create training session' });
  }
});

// POST /api/ai/return-risk
// Audit-recommended: Predictive return prevention (flag at-risk adoptions; proactive support)
router.post('/return-risk', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { animalId, adopterProfile } = req.body;
    const err = validatePositiveInt(animalId, 'animalId');
    if (err) return res.status(400).json({ error: err });
    if (!adopterProfile || typeof adopterProfile !== 'object') {
      return res.status(400).json({ error: 'adopterProfile object is required' });
    }

    const animalResult = await pool.query('SELECT * FROM animals WHERE id = $1', [animalId]);
    if (animalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }
    const animal = animalResult.rows[0];

    const systemPrompt = `You are an expert animal-welfare adoption advisor. Given an animal's profile and an adopter's profile, predict the risk that the adoption will end in a return, identify the top contributing factors, and recommend pre-adoption support actions to reduce risk. Respond ONLY with valid JSON (no markdown fences):
{
  "return_risk_score": number,
  "risk_level": "Low|Medium|High|Very High",
  "top_risk_factors": [
    { "factor": "string", "weight": number, "explanation": "string" }
  ],
  "protective_factors": ["string"],
  "recommended_pre_adoption_actions": ["string", "string"],
  "recommended_post_adoption_followups": [
    { "timing": "string", "action": "string" }
  ],
  "training_resources_to_share": ["string"],
  "behavior_compatibility_notes": "string",
  "lifestyle_compatibility_notes": "string",
  "confidence_score": number
}`;

    const userPrompt = `Animal:
- name: ${animal.name}
- species: ${animal.species}
- breed: ${animal.breed}
- age_years: ${animal.age_years}
- temperament/notes: ${animal.description || 'n/a'}
- status: ${animal.status}

Adopter profile:
${JSON.stringify(adopterProfile, null, 2)}

Predict adoption return risk.`;

    const rawResponse = await callOpenRouter(systemPrompt, userPrompt);
    let structured;
    try {
      const stripped = rawResponse.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
      structured = JSON.parse(stripped);
    } catch {
      structured = { raw_response: rawResponse, parse_error: 'AI did not return valid JSON' };
    }

    res.json({
      animal: { id: animal.id, name: animal.name, species: animal.species },
      result: structured,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Return risk error:', error);
    res.status(500).json({ error: 'Failed to score adoption return risk' });
  }
});

module.exports = router;
