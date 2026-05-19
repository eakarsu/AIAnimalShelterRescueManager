const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/kennels
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = ((parseInt(req.query.page) || 1) - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM kennels');
    const result = await pool.query(
      'SELECT * FROM kennels ORDER BY kennel_number LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(req.query.page) || 1,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (error) {
    console.error('Get kennels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/kennels/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const kennel = await pool.query('SELECT * FROM kennels WHERE id = $1', [id]);
    if (kennel.rows.length === 0) {
      return res.status(404).json({ error: 'Kennel not found' });
    }

    const assignments = await pool.query(
      `SELECT ka.*, a.name as animal_name, a.species, a.breed
       FROM kennel_assignments ka
       JOIN animals a ON ka.animal_id = a.id
       WHERE ka.kennel_id = $1 AND ka.released_date IS NULL`, [id]
    );

    res.json({ ...kennel.rows[0], current_assignments: assignments.rows });
  } catch (error) {
    console.error('Get kennel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kennels
router.post('/', async (req, res) => {
  try {
    const { kennel_number, building, kennel_type, capacity, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO kennels (kennel_number, building, kennel_type, capacity, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [kennel_number, building, kennel_type, capacity || 1, status || 'available', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create kennel error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Kennel number already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/kennels/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { kennel_number, building, kennel_type, capacity, current_occupancy, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE kennels SET kennel_number=$1, building=$2, kennel_type=$3, capacity=$4, current_occupancy=$5, status=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [kennel_number, building, kennel_type, capacity, current_occupancy, status, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kennel not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update kennel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/kennels/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM kennels WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kennel not found' });
    }
    res.json({ message: 'Kennel deleted successfully' });
  } catch (error) {
    console.error('Delete kennel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kennels/assign
router.post('/assign', async (req, res) => {
  try {
    const { animal_id, kennel_id, assigned_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO kennel_assignments (animal_id, kennel_id, assigned_date, notes)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [animal_id, kennel_id, assigned_date || new Date().toISOString().split('T')[0], notes]
    );

    await pool.query(
      'UPDATE kennels SET current_occupancy = current_occupancy + 1, status = CASE WHEN current_occupancy + 1 >= capacity THEN \'occupied\' ELSE status END WHERE id = $1',
      [kennel_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Assign kennel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/kennels/release/:id
router.put('/release/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await pool.query(
      `UPDATE kennel_assignments SET released_date = $1 WHERE id = $2 RETURNING *`,
      [new Date().toISOString().split('T')[0], id]
    );
    if (assignment.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await pool.query(
      `UPDATE kennels SET current_occupancy = GREATEST(current_occupancy - 1, 0),
       status = CASE WHEN current_occupancy - 1 <= 0 THEN 'available' ELSE status END
       WHERE id = $1`,
      [assignment.rows[0].kennel_id]
    );

    res.json(assignment.rows[0]);
  } catch (error) {
    console.error('Release kennel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
