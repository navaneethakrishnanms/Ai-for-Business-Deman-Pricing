import express from 'express';
import { query, withTransaction } from '../db/index.js';

const router = express.Router();

/**
 * GET /api/menu
 * Example: Fetch all menu items using promise-based query
 */
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await query('SELECT * FROM menu_items ORDER BY category, name');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/menu/bulk-update
 * Example: Transaction-based execution template
 */
router.post('/bulk-update', async (req, res, next) => {
  const { updates } = req.body; // e.g. [{ id: 1, price: 75 }, ...]
  
  try {
    const result = await withTransaction(async (conn) => {
      const updatedRows = [];
      for (const item of (updates || [])) {
        const [res] = await conn.execute(
          'UPDATE menu_items SET price = ? WHERE id = ?',
          [item.price, item.id]
        );
        updatedRows.push({ id: item.id, affectedRows: res.affectedRows });
      }
      return updatedRows;
    });

    res.json({ success: true, message: 'Transaction committed successfully', result });
  } catch (error) {
    next(error);
  }
});

export default router;
