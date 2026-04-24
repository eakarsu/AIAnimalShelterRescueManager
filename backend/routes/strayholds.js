const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/strayholds
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT sh.*, a.name as animal_name, a.species, a.breed FROM stray_holds sh LEFT JOIN animals a ON sh.animal_id = a.id';
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE sh.status = $${params.length}`;
    }
    query += ' ORDER BY sh.hold_start_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get stray holds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/strayholds/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT sh.*, a.name as animal_name, a.species, a.breed FROM stray_holds sh LEFT JOIN animals a ON sh.animal_id = a.id WHERE sh.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stray hold not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get stray hold error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/strayholds
router.post('/', async (req, res) => {
  try {
    const { animal_id, intake_date, hold_start_date, hold_end_date, legal_hold_days, found_location, finder_name, finder_phone, is_claimed, claimed_by, claimed_date, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO stray_holds (animal_id, intake_date, hold_start_date, hold_end_date, legal_hold_days, found_location, finder_name, finder_phone, is_claimed, claimed_by, claimed_date, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [animal_id, intake_date, hold_start_date, hold_end_date, legal_hold_days || 3, found_location, finder_name, finder_phone, is_claimed || false, claimed_by, claimed_date, status || 'on_hold', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create stray hold error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/strayholds/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { animal_id, intake_date, hold_start_date, hold_end_date, legal_hold_days, found_location, finder_name, finder_phone, is_claimed, claimed_by, claimed_date, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE stray_holds SET animal_id=$1, intake_date=$2, hold_start_date=$3, hold_end_date=$4, legal_hold_days=$5, found_location=$6, finder_name=$7, finder_phone=$8, is_claimed=$9, claimed_by=$10, claimed_date=$11, status=$12, notes=$13
       WHERE id=$14 RETURNING *`,
      [animal_id, intake_date, hold_start_date, hold_end_date, legal_hold_days, found_location, finder_name, finder_phone, is_claimed, claimed_by, claimed_date, status, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stray hold not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update stray hold error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/strayholds/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM stray_holds WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stray hold not found' });
    }
    res.json({ message: 'Stray hold deleted successfully' });
  } catch (error) {
    console.error('Delete stray hold error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
