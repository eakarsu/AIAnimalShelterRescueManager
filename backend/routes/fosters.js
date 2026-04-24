const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/fosters/placements (must be before /:id)
router.get('/placements', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fp.*, a.name as animal_name, a.species, fh.foster_name
       FROM foster_placements fp
       LEFT JOIN animals a ON fp.animal_id = a.id
       LEFT JOIN foster_homes fh ON fp.foster_home_id = fh.id
       ORDER BY fp.start_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get placements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fosters
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM foster_homes ORDER BY foster_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get foster homes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fosters/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const home = await pool.query('SELECT * FROM foster_homes WHERE id = $1', [id]);
    if (home.rows.length === 0) {
      return res.status(404).json({ error: 'Foster home not found' });
    }

    const placements = await pool.query(
      `SELECT fp.*, a.name as animal_name, a.species, a.breed
       FROM foster_placements fp
       LEFT JOIN animals a ON fp.animal_id = a.id
       WHERE fp.foster_home_id = $1 ORDER BY fp.start_date DESC`, [id]
    );

    res.json({ ...home.rows[0], placements: placements.rows });
  } catch (error) {
    console.error('Get foster home error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fosters
router.post('/', async (req, res) => {
  try {
    const { foster_name, email, phone, address, housing_type, has_yard, max_animals, can_foster_dogs, can_foster_cats, can_foster_medical, can_foster_behavioral, experience, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO foster_homes (foster_name, email, phone, address, housing_type, has_yard, max_animals, can_foster_dogs, can_foster_cats, can_foster_medical, can_foster_behavioral, experience, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [foster_name, email, phone, address, housing_type, has_yard, max_animals, can_foster_dogs, can_foster_cats, can_foster_medical, can_foster_behavioral, experience, status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create foster home error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/fosters/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { foster_name, email, phone, address, housing_type, has_yard, max_animals, current_animals, can_foster_dogs, can_foster_cats, can_foster_medical, can_foster_behavioral, experience, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE foster_homes SET foster_name=$1, email=$2, phone=$3, address=$4, housing_type=$5, has_yard=$6, max_animals=$7, current_animals=$8, can_foster_dogs=$9, can_foster_cats=$10, can_foster_medical=$11, can_foster_behavioral=$12, experience=$13, status=$14, notes=$15
       WHERE id=$16 RETURNING *`,
      [foster_name, email, phone, address, housing_type, has_yard, max_animals, current_animals, can_foster_dogs, can_foster_cats, can_foster_medical, can_foster_behavioral, experience, status, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Foster home not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update foster home error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/fosters/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM foster_homes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Foster home not found' });
    }
    res.json({ message: 'Foster home deleted successfully' });
  } catch (error) {
    console.error('Delete foster home error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fosters/placements
router.post('/placements', async (req, res) => {
  try {
    const { animal_id, foster_home_id, start_date, end_date, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO foster_placements (animal_id, foster_home_id, start_date, end_date, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [animal_id, foster_home_id, start_date, end_date, status || 'active', notes]
    );

    await pool.query(
      'UPDATE foster_homes SET current_animals = current_animals + 1 WHERE id = $1',
      [foster_home_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create placement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/fosters/placements/:id
router.put('/placements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { animal_id, foster_home_id, start_date, end_date, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE foster_placements SET animal_id=$1, foster_home_id=$2, start_date=$3, end_date=$4, status=$5, notes=$6
       WHERE id=$7 RETURNING *`,
      [animal_id, foster_home_id, start_date, end_date, status, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Placement not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update placement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
