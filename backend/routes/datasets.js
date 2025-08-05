const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 获取所有数据集
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT d.*, u.username as created_by_name 
      FROM datasets d 
      LEFT JOIN users u ON d.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND d.data_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (d.name ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM datasets d WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;
    
    if (type) {
      countQuery += ` AND d.data_type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (d.name ILIKE $${countParamIndex} OR d.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      datasets: result.rows,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取数据集列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个数据集
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT d.*, u.username as created_by_name 
      FROM datasets d 
      LEFT JOIN users u ON d.created_by = u.id 
      WHERE d.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取数据集详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建数据集
router.post('/', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const {
      name,
      description,
      publisher,
      storage_path,
      data_type,
      access_path,
      example,
      data_count
    } = req.body;

    if (!name || !data_type) {
      return res.status(400).json({ error: '数据集名称和类型不能为空' });
    }

    const result = await pool.query(`
      INSERT INTO datasets (name, description, publisher, storage_path, data_type, access_path, example, data_count, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [name, description, publisher, storage_path, data_type, access_path, example, data_count, req.user.id]);

    res.status(201).json({
      message: '数据集创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('创建数据集错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新数据集
router.put('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      publisher,
      storage_path,
      data_type,
      access_path,
      example,
      data_count
    } = req.body;

    // 检查数据集是否存在
    const existingDataset = await pool.query('SELECT * FROM datasets WHERE id = $1', [id]);
    if (existingDataset.rows.length === 0) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    // 检查权限（只有创建者或管理员可以修改）
    if (req.user.role !== 'admin' && existingDataset.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    const result = await pool.query(`
      UPDATE datasets 
      SET name = $1, description = $2, publisher = $3, storage_path = $4,
          data_type = $5, access_path = $6, example = $7, data_count = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [name, description, publisher, storage_path, data_type, access_path, example, data_count, id]);

    res.json({
      message: '数据集更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('更新数据集错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除数据集
router.delete('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查数据集是否存在
    const existingDataset = await pool.query('SELECT * FROM datasets WHERE id = $1', [id]);
    if (existingDataset.rows.length === 0) {
      return res.status(404).json({ error: '数据集不存在' });
    }

    // 检查权限（只有创建者或管理员可以删除）
    if (req.user.role !== 'admin' && existingDataset.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    await pool.query('DELETE FROM datasets WHERE id = $1', [id]);

    res.json({ message: '数据集删除成功' });
  } catch (error) {
    console.error('删除数据集错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;