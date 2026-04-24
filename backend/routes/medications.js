const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/medications
router.get('/', async (req, res) => {
  try {
    const { animal_id } = req.query;
    let query = 'SELECT ml.*, a.name as animal_name FROM medication_log ml LEFT JOIN animals a ON ml.animal_id = a.id';
    const params = [];

    if (animal_id) {
      params.push(animal_id);
      query += ` WHERE ml.animal_id = $${params.length}`;
    }
    query += ' ORDER BY ml.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/medications/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT ml.*, a.name as animal_name FROM medication_log ml LEFT JOIN animals a ON ml.animal_id = a.id WHERE ml.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medication record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get medication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/medications
router.post('/', async (req, res) => {
  try {
    const { animal_id, medication_name, dosage, frequency, route, start_date, end_date, administered_by, administered_at, status, side_effects, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO medication_log (animal_id, medication_name, dosage, frequency, route, start_date, end_date, administered_by, administered_at, status, side_effects, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [animal_id, medication_name, dosage, frequency, route, start_date, end_date, administered_by, administered_at, status || 'active', side_effects, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/medications/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { animal_id, medication_name, dosage, frequency, route, start_date, end_date, administered_by, administered_at, status, side_effects, notes } = req.body;
    const result = await pool.query(
      `UPDATE medication_log SET animal_id=$1, medication_name=$2, dosage=$3, frequency=$4, route=$5, start_date=$6, end_date=$7, administered_by=$8, administered_at=$9, status=$10, side_effects=$11, notes=$12
       WHERE id=$13 RETURNING *`,
      [animal_id, medication_name, dosage, frequency, route, start_date, end_date, administered_by, administered_at, status, side_effects, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medication record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/medications/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM medication_log WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medication record not found' });
    }
    res.json({ message: 'Medication record deleted successfully' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
