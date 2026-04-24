const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/donations/stats (must be before /:id)
router.get('/stats', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total_amount, COUNT(*) as total_donations FROM donations');
    const monthlyResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as monthly_amount, COUNT(*) as monthly_donations
       FROM donations WHERE donation_date >= DATE_TRUNC('month', CURRENT_DATE)`
    );
    const campaignResult = await pool.query(
      `SELECT campaign, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM donations GROUP BY campaign ORDER BY total DESC`
    );
    const recurringResult = await pool.query(
      'SELECT COUNT(*) as recurring_donors, COALESCE(SUM(amount), 0) as recurring_amount FROM donations WHERE is_recurring = true'
    );

    res.json({
      total: totalResult.rows[0],
      monthly: monthlyResult.rows[0],
      by_campaign: campaignResult.rows,
      recurring: recurringResult.rows[0],
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/donations
router.get('/', async (req, res) => {
  try {
    const { campaign, donation_type } = req.query;
    let query = 'SELECT * FROM donations';
    const conditions = [];
    const params = [];

    if (campaign) {
      params.push(campaign);
      conditions.push(`campaign = $${params.length}`);
    }
    if (donation_type) {
      params.push(donation_type);
      conditions.push(`donation_type = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY donation_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/donations/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM donations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/donations
router.post('/', async (req, res) => {
  try {
    const { donor_name, donor_email, amount, donation_type, campaign, payment_method, donation_date, receipt_number, is_recurring, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO donations (donor_name, donor_email, amount, donation_type, campaign, payment_method, donation_date, receipt_number, is_recurring, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [donor_name, donor_email, amount, donation_type, campaign, payment_method, donation_date, receipt_number, is_recurring || false, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/donations/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { donor_name, donor_email, amount, donation_type, campaign, payment_method, donation_date, receipt_number, is_recurring, notes } = req.body;
    const result = await pool.query(
      `UPDATE donations SET donor_name=$1, donor_email=$2, amount=$3, donation_type=$4, campaign=$5, payment_method=$6, donation_date=$7, receipt_number=$8, is_recurring=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [donor_name, donor_email, amount, donation_type, campaign, payment_method, donation_date, receipt_number, is_recurring, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/donations/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM donations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Delete donation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
