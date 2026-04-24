const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/inventory/low-stock (must be before /:id)
router.get('/low-stock', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM supply_inventory WHERE quantity <= reorder_level ORDER BY (quantity::float / NULLIF(reorder_level, 0)::float) ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM supply_inventory';
    const params = [];

    if (category) {
      params.push(category);
      query += ` WHERE category = $${params.length}`;
    }
    query += ' ORDER BY item_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/inventory/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM supply_inventory WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/inventory
router.post('/', async (req, res) => {
  try {
    const { item_name, category, quantity, unit, reorder_level, cost_per_unit, supplier, location, last_restocked, expiry_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO supply_inventory (item_name, category, quantity, unit, reorder_level, cost_per_unit, supplier, location, last_restocked, expiry_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [item_name, category, quantity, unit, reorder_level, cost_per_unit, supplier, location, last_restocked, expiry_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/inventory/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, category, quantity, unit, reorder_level, cost_per_unit, supplier, location, last_restocked, expiry_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE supply_inventory SET item_name=$1, category=$2, quantity=$3, unit=$4, reorder_level=$5, cost_per_unit=$6, supplier=$7, location=$8, last_restocked=$9, expiry_date=$10, notes=$11
       WHERE id=$12 RETURNING *`,
      [item_name, category, quantity, unit, reorder_level, cost_per_unit, supplier, location, last_restocked, expiry_date, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM supply_inventory WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
