const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/quarantine
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT q.*, a.name as animal_name, a.species, a.breed FROM quarantine q LEFT JOIN animals a ON q.animal_id = a.id';
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE q.status = $${params.length}`;
    }
    query += ' ORDER BY q.start_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get quarantine records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quarantine/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT q.*, a.name as animal_name, a.species, a.breed FROM quarantine q LEFT JOIN animals a ON q.animal_id = a.id WHERE q.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quarantine record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get quarantine record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quarantine
router.post('/', async (req, res) => {
  try {
    const { animal_id, reason, start_date, expected_end_date, actual_end_date, location, monitoring_notes, veterinarian, status, release_approved_by, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO quarantine (animal_id, reason, start_date, expected_end_date, actual_end_date, location, monitoring_notes, veterinarian, status, release_approved_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [animal_id, reason, start_date, expected_end_date, actual_end_date, location, monitoring_notes, veterinarian, status || 'active', release_approved_by, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create quarantine record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/quarantine/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { animal_id, reason, start_date, expected_end_date, actual_end_date, location, monitoring_notes, veterinarian, status, release_approved_by, notes } = req.body;
    const result = await pool.query(
      `UPDATE quarantine SET animal_id=$1, reason=$2, start_date=$3, expected_end_date=$4, actual_end_date=$5, location=$6, monitoring_notes=$7, veterinarian=$8, status=$9, release_approved_by=$10, notes=$11
       WHERE id=$12 RETURNING *`,
      [animal_id, reason, start_date, expected_end_date, actual_end_date, location, monitoring_notes, veterinarian, status, release_approved_by, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quarantine record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update quarantine record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/quarantine/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM quarantine WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quarantine record not found' });
    }
    res.json({ message: 'Quarantine record deleted successfully' });
  } catch (error) {
    console.error('Delete quarantine record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
