const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const { event_type, status } = req.query;
    let query = 'SELECT * FROM events';
    const conditions = [];
    const params = [];

    if (event_type) {
      params.push(event_type);
      conditions.push(`event_type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY event_date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/events
router.post('/', async (req, res) => {
  try {
    const { event_name, event_type, event_date, start_time, end_time, location, description, max_participants, organizer, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO events (event_name, event_type, event_date, start_time, end_time, location, description, max_participants, organizer, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [event_name, event_type, event_date, start_time, end_time, location, description, max_participants, organizer, status || 'planned', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/events/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { event_name, event_type, event_date, start_time, end_time, location, description, max_participants, current_participants, organizer, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE events SET event_name=$1, event_type=$2, event_date=$3, start_time=$4, end_time=$5, location=$6, description=$7, max_participants=$8, current_participants=$9, organizer=$10, status=$11, notes=$12
       WHERE id=$13 RETURNING *`,
      [event_name, event_type, event_date, start_time, end_time, location, description, max_participants, current_participants, organizer, status, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
