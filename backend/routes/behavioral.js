const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/behavioral
router.get('/', async (req, res) => {
  try {
    const { animal_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = ((parseInt(req.query.page) || 1) - 1) * limit;

    let baseQuery = 'FROM behavioral_assessments ba LEFT JOIN animals a ON ba.animal_id = a.id';
    const params = [];

    if (animal_id) {
      params.push(animal_id);
      baseQuery += ` WHERE ba.animal_id = $${params.length}`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT ba.*, a.name as animal_name ${baseQuery} ORDER BY ba.assessment_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    console.error('Get behavioral assessments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/behavioral/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT ba.*, a.name as animal_name FROM behavioral_assessments ba LEFT JOIN animals a ON ba.animal_id = a.id WHERE ba.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Behavioral assessment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get behavioral assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/behavioral
router.post('/', async (req, res) => {
  try {
    const { animal_id, assessor, assessment_date, aggression_level, fear_level, sociability_level, energy_level, trainability_level, good_with_kids, good_with_dogs, good_with_cats, bite_history, bite_details, notes, overall_rating } = req.body;
    const result = await pool.query(
      `INSERT INTO behavioral_assessments (animal_id, assessor, assessment_date, aggression_level, fear_level, sociability_level, energy_level, trainability_level, good_with_kids, good_with_dogs, good_with_cats, bite_history, bite_details, notes, overall_rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [animal_id, assessor, assessment_date, aggression_level, fear_level, sociability_level, energy_level, trainability_level, good_with_kids, good_with_dogs, good_with_cats, bite_history || false, bite_details, notes, overall_rating]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create behavioral assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/behavioral/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { animal_id, assessor, assessment_date, aggression_level, fear_level, sociability_level, energy_level, trainability_level, good_with_kids, good_with_dogs, good_with_cats, bite_history, bite_details, notes, overall_rating } = req.body;
    const result = await pool.query(
      `UPDATE behavioral_assessments SET animal_id=$1, assessor=$2, assessment_date=$3, aggression_level=$4, fear_level=$5, sociability_level=$6, energy_level=$7, trainability_level=$8, good_with_kids=$9, good_with_dogs=$10, good_with_cats=$11, bite_history=$12, bite_details=$13, notes=$14, overall_rating=$15
       WHERE id=$16 RETURNING *`,
      [animal_id, assessor, assessment_date, aggression_level, fear_level, sociability_level, energy_level, trainability_level, good_with_kids, good_with_dogs, good_with_cats, bite_history, bite_details, notes, overall_rating, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Behavioral assessment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update behavioral assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/behavioral/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM behavioral_assessments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Behavioral assessment not found' });
    }
    res.json({ message: 'Behavioral assessment deleted successfully' });
  } catch (error) {
    console.error('Delete behavioral assessment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
