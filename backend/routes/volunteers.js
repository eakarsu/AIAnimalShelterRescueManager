const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/volunteers/schedules (must be before /:id)
router.get('/schedules', async (req, res) => {
  try {
    const { volunteer_id } = req.query;
    let query = `SELECT vs.*, v.name as volunteer_name FROM volunteer_schedules vs LEFT JOIN volunteers v ON vs.volunteer_id = v.id`;
    const params = [];

    if (volunteer_id) {
      params.push(volunteer_id);
      query += ` WHERE vs.volunteer_id = $${params.length}`;
    }
    query += ' ORDER BY vs.scheduled_date DESC, vs.start_time';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/volunteers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM volunteers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/volunteers/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const volunteer = await pool.query('SELECT * FROM volunteers WHERE id = $1', [id]);
    if (volunteer.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    const schedules = await pool.query(
      'SELECT * FROM volunteer_schedules WHERE volunteer_id = $1 ORDER BY scheduled_date DESC, start_time',
      [id]
    );

    res.json({ ...volunteer.rows[0], schedules: schedules.rows });
  } catch (error) {
    console.error('Get volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/volunteers
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, emergency_contact, emergency_phone, skills, availability, status, start_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO volunteers (name, email, phone, address, emergency_contact, emergency_phone, skills, availability, status, start_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, email, phone, address, emergency_contact, emergency_phone, skills, availability, status || 'active', start_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/volunteers/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, emergency_contact, emergency_phone, skills, availability, status, start_date, hours_completed, notes } = req.body;
    const result = await pool.query(
      `UPDATE volunteers SET name=$1, email=$2, phone=$3, address=$4, emergency_contact=$5, emergency_phone=$6, skills=$7, availability=$8, status=$9, start_date=$10, hours_completed=$11, notes=$12
       WHERE id=$13 RETURNING *`,
      [name, email, phone, address, emergency_contact, emergency_phone, skills, availability, status, start_date, hours_completed, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/volunteers/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM volunteers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    res.json({ message: 'Volunteer deleted successfully' });
  } catch (error) {
    console.error('Delete volunteer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/volunteers/schedules
router.post('/schedules', async (req, res) => {
  try {
    const { volunteer_id, scheduled_date, start_time, end_time, task, area, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO volunteer_schedules (volunteer_id, scheduled_date, start_time, end_time, task, area, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [volunteer_id, scheduled_date, start_time, end_time, task, area, status || 'scheduled', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/volunteers/schedules/:id
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteer_id, scheduled_date, start_time, end_time, task, area, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE volunteer_schedules SET volunteer_id=$1, scheduled_date=$2, start_time=$3, end_time=$4, task=$5, area=$6, status=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [volunteer_id, scheduled_date, start_time, end_time, task, area, status, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/volunteers/schedules/:id
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM volunteer_schedules WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
