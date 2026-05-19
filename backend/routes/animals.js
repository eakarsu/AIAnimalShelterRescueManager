const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/animals
router.get('/', async (req, res) => {
  try {
    const { species, status, breed } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = ((parseInt(req.query.page) || 1) - 1) * limit;

    let baseQuery = 'FROM animals';
    const conditions = [];
    const params = [];

    if (species) {
      params.push(species);
      conditions.push(`species = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (breed) {
      params.push(`%${breed}%`);
      conditions.push(`breed ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const dataQuery = `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(dataQuery, params);

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
    console.error('Get animals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/animals/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const animal = await pool.query('SELECT * FROM animals WHERE id = $1', [id]);
    if (animal.rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const medical = await pool.query('SELECT * FROM medical_records WHERE animal_id = $1 ORDER BY record_date DESC', [id]);
    const behavioral = await pool.query('SELECT * FROM behavioral_assessments WHERE animal_id = $1 ORDER BY assessment_date DESC', [id]);
    const kennel = await pool.query(
      `SELECT ka.*, k.kennel_number, k.building FROM kennel_assignments ka
       JOIN kennels k ON ka.kennel_id = k.id
       WHERE ka.animal_id = $1 AND ka.released_date IS NULL`, [id]
    );
    const medications = await pool.query('SELECT * FROM medication_log WHERE animal_id = $1 ORDER BY created_at DESC', [id]);

    res.json({
      ...animal.rows[0],
      medical_records: medical.rows,
      behavioral_assessments: behavioral.rows,
      current_kennel: kennel.rows[0] || null,
      medications: medications.rows,
    });
  } catch (error) {
    console.error('Get animal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/animals
router.post('/', async (req, res) => {
  try {
    const { name, species, breed, age_years, age_months, weight, color, sex, microchip_number, intake_date, intake_type, status, description, photo_url } = req.body;
    const result = await pool.query(
      `INSERT INTO animals (name, species, breed, age_years, age_months, weight, color, sex, microchip_number, intake_date, intake_type, status, description, photo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [name, species, breed, age_years, age_months, weight, color, sex, microchip_number, intake_date, intake_type, status || 'available', description, photo_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create animal error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Microchip number already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/animals/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, species, breed, age_years, age_months, weight, color, sex, microchip_number, intake_date, intake_type, status, description, photo_url } = req.body;
    const result = await pool.query(
      `UPDATE animals SET name=$1, species=$2, breed=$3, age_years=$4, age_months=$5, weight=$6, color=$7, sex=$8, microchip_number=$9, intake_date=$10, intake_type=$11, status=$12, description=$13, photo_url=$14
       WHERE id=$15 RETURNING *`,
      [name, species, breed, age_years, age_months, weight, color, sex, microchip_number, intake_date, intake_type, status, description, photo_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update animal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/animals/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM animals WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Animal not found' });
    }
    res.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Delete animal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
