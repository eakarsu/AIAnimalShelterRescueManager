const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/medical
router.get('/', async (req, res) => {
  try {
    const { animal_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = ((parseInt(req.query.page) || 1) - 1) * limit;

    let baseQuery = 'FROM medical_records mr LEFT JOIN animals a ON mr.animal_id = a.id';
    const params = [];

    if (animal_id) {
      params.push(animal_id);
      baseQuery += ` WHERE mr.animal_id = $${params.length}`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT mr.*, a.name as animal_name ${baseQuery} ORDER BY mr.record_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: {
        total,
        page: parseInt(req.query.page) || 1,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/medical/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT mr.*, a.name as animal_name FROM medical_records mr LEFT JOIN animals a ON mr.animal_id = a.id WHERE mr.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/medical
router.post('/', async (req, res) => {
  try {
    const { animal_id, record_type, description, veterinarian, record_date, next_due_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO medical_records (animal_id, record_type, description, veterinarian, record_date, next_due_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [animal_id, record_type, description, veterinarian, record_date, next_due_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/medical/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { animal_id, record_type, description, veterinarian, record_date, next_due_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE medical_records SET animal_id=$1, record_type=$2, description=$3, veterinarian=$4, record_date=$5, next_due_date=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [animal_id, record_type, description, veterinarian, record_date, next_due_date, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/medical/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM medical_records WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
