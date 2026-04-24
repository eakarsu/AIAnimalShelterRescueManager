const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/lostfound
router.get('/', async (req, res) => {
  try {
    const { report_type, status } = req.query;
    let query = 'SELECT lf.*, a.name as matched_animal_name FROM lost_found lf LEFT JOIN animals a ON lf.matched_animal_id = a.id';
    const conditions = [];
    const params = [];

    if (report_type) {
      params.push(report_type);
      conditions.push(`lf.report_type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`lf.status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY lf.date_reported DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get lost/found error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/lostfound/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT lf.*, a.name as matched_animal_name FROM lost_found lf LEFT JOIN animals a ON lf.matched_animal_id = a.id WHERE lf.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lost/found report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/lostfound
router.post('/', async (req, res) => {
  try {
    const { report_type, animal_type, breed, color, size, sex, microchip_number, location_found_lost, date_reported, reporter_name, reporter_phone, reporter_email, description, photo_url, status, matched_animal_id, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO lost_found (report_type, animal_type, breed, color, size, sex, microchip_number, location_found_lost, date_reported, reporter_name, reporter_phone, reporter_email, description, photo_url, status, matched_animal_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [report_type, animal_type, breed, color, size, sex, microchip_number, location_found_lost, date_reported, reporter_name, reporter_phone, reporter_email, description, photo_url, status || 'open', matched_animal_id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lost/found report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/lostfound/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { report_type, animal_type, breed, color, size, sex, microchip_number, location_found_lost, date_reported, reporter_name, reporter_phone, reporter_email, description, photo_url, status, matched_animal_id, notes } = req.body;
    const result = await pool.query(
      `UPDATE lost_found SET report_type=$1, animal_type=$2, breed=$3, color=$4, size=$5, sex=$6, microchip_number=$7, location_found_lost=$8, date_reported=$9, reporter_name=$10, reporter_phone=$11, reporter_email=$12, description=$13, photo_url=$14, status=$15, matched_animal_id=$16, notes=$17
       WHERE id=$18 RETURNING *`,
      [report_type, animal_type, breed, color, size, sex, microchip_number, location_found_lost, date_reported, reporter_name, reporter_phone, reporter_email, description, photo_url, status, matched_animal_id, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lost/found report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/lostfound/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM lost_found WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete lost/found report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
