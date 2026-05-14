const express = require('express');
const router = express.Router();
const pool = require('../db');

// --- Adoption Applications ---

// GET /api/adoptions/applications
router.get('/applications', async (req, res) => {
  try {
    const { status } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = ((parseInt(req.query.page) || 1) - 1) * limit;

    let baseQuery = 'FROM adoption_applications aa LEFT JOIN animals a ON aa.animal_id = a.id';
    const params = [];

    if (status) {
      params.push(status);
      baseQuery += ` WHERE aa.status = $${params.length}`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT aa.*, a.name as animal_name ${baseQuery} ORDER BY aa.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/adoptions/applications/:id
router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT aa.*, a.name as animal_name FROM adoption_applications aa LEFT JOIN animals a ON aa.animal_id = a.id WHERE aa.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/adoptions/applications
router.post('/applications', async (req, res) => {
  try {
    const { applicant_name, email, phone, address, housing_type, has_yard, has_other_pets, other_pets_details, has_children, children_ages, experience, preferred_species, preferred_breed, preferred_age, preferred_size, reason, veterinarian_reference, status, animal_id, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO adoption_applications (applicant_name, email, phone, address, housing_type, has_yard, has_other_pets, other_pets_details, has_children, children_ages, experience, preferred_species, preferred_breed, preferred_age, preferred_size, reason, veterinarian_reference, status, animal_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
      [applicant_name, email, phone, address, housing_type, has_yard, has_other_pets, other_pets_details, has_children, children_ages, experience, preferred_species, preferred_breed, preferred_age, preferred_size, reason, veterinarian_reference, status || 'pending', animal_id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/adoptions/applications/:id
router.put('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { applicant_name, email, phone, address, housing_type, has_yard, has_other_pets, other_pets_details, has_children, children_ages, experience, preferred_species, preferred_breed, preferred_age, preferred_size, reason, veterinarian_reference, status, animal_id, notes } = req.body;
    const result = await pool.query(
      `UPDATE adoption_applications SET applicant_name=$1, email=$2, phone=$3, address=$4, housing_type=$5, has_yard=$6, has_other_pets=$7, other_pets_details=$8, has_children=$9, children_ages=$10, experience=$11, preferred_species=$12, preferred_breed=$13, preferred_age=$14, preferred_size=$15, reason=$16, veterinarian_reference=$17, status=$18, animal_id=$19, notes=$20
       WHERE id=$21 RETURNING *`,
      [applicant_name, email, phone, address, housing_type, has_yard, has_other_pets, other_pets_details, has_children, children_ages, experience, preferred_species, preferred_breed, preferred_age, preferred_size, reason, veterinarian_reference, status, animal_id, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/adoptions/applications/:id
router.delete('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM adoption_applications WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Adoption Contracts ---

// GET /api/adoptions/contracts
router.get('/contracts', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = ((parseInt(req.query.page) || 1) - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM adoption_contracts');
    const result = await pool.query(
      `SELECT ac.*, a.name as animal_name FROM adoption_contracts ac LEFT JOIN animals a ON ac.animal_id = a.id ORDER BY ac.created_at DESC LIMIT $1 OFFSET $2`,
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
    console.error('Get contracts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/adoptions/contracts/:id
router.get('/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ac.*, a.name as animal_name, aa.applicant_name, aa.email, aa.phone
       FROM adoption_contracts ac
       LEFT JOIN animals a ON ac.animal_id = a.id
       LEFT JOIN adoption_applications aa ON ac.application_id = aa.id
       WHERE ac.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/adoptions/contracts
router.post('/contracts', async (req, res) => {
  try {
    const { application_id, animal_id, adopter_name, adoption_date, adoption_fee, spay_neuter_required, return_policy, special_conditions, status } = req.body;
    const result = await pool.query(
      `INSERT INTO adoption_contracts (application_id, animal_id, adopter_name, adoption_date, adoption_fee, spay_neuter_required, return_policy, special_conditions, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [application_id, animal_id, adopter_name, adoption_date, adoption_fee, spay_neuter_required, return_policy, special_conditions, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/adoptions/contracts/:id
router.put('/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { application_id, animal_id, adopter_name, adoption_date, adoption_fee, spay_neuter_required, return_policy, special_conditions, status } = req.body;
    const result = await pool.query(
      `UPDATE adoption_contracts SET application_id=$1, animal_id=$2, adopter_name=$3, adoption_date=$4, adoption_fee=$5, spay_neuter_required=$6, return_policy=$7, special_conditions=$8, status=$9
       WHERE id=$10 RETURNING *`,
      [application_id, animal_id, adopter_name, adoption_date, adoption_fee, spay_neuter_required, return_policy, special_conditions, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/adoptions/contracts/:id
router.delete('/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM adoption_contracts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
