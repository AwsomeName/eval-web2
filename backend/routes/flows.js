const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 获取所有Flow
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT f.*, u.username as created_by_name 
      FROM flows f 
      LEFT JOIN users u ON f.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND f.flow_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (f.name ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY f.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM flows f WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;
    
    if (type) {
      countQuery += ` AND f.flow_type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (f.name ILIKE $${countParamIndex} OR f.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      flows: result.rows,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取Flow列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个Flow
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT f.*, u.username as created_by_name 
      FROM flows f 
      LEFT JOIN users u ON f.created_by = u.id 
      WHERE f.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flow不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取Flow详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建Flow
router.post('/', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const {
      name,
      description,
      publisher,
      flow_type,
      access_url,
      input_format,
      output_format
    } = req.body;

    if (!name || !flow_type) {
      return res.status(400).json({ error: 'Flow名称和类型不能为空' });
    }

    const result = await pool.query(`
      INSERT INTO flows (name, description, publisher, flow_type, access_url, input_format, output_format, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, description, publisher, flow_type, access_url, input_format, output_format, req.user.id]);

    res.status(201).json({
      message: 'Flow创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('创建Flow错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新Flow
router.put('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      publisher,
      flow_type,
      access_url,
      input_format,
      output_format
    } = req.body;

    // 检查Flow是否存在
    const existingFlow = await pool.query('SELECT * FROM flows WHERE id = $1', [id]);
    if (existingFlow.rows.length === 0) {
      return res.status(404).json({ error: 'Flow不存在' });
    }

    // 检查权限
    if (req.user.role !== 'admin' && existingFlow.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    const result = await pool.query(`
      UPDATE flows 
      SET name = $1, description = $2, publisher = $3, flow_type = $4,
          access_url = $5, input_format = $6, output_format = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [name, description, publisher, flow_type, access_url, input_format, output_format, id]);

    res.json({
      message: 'Flow更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('更新Flow错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除Flow
router.delete('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查Flow是否存在
    const existingFlow = await pool.query('SELECT * FROM flows WHERE id = $1', [id]);
    if (existingFlow.rows.length === 0) {
      return res.status(404).json({ error: 'Flow不存在' });
    }

    // 检查权限
    if (req.user.role !== 'admin' && existingFlow.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    await pool.query('DELETE FROM flows WHERE id = $1', [id]);

    res.json({ message: 'Flow删除成功' });
  } catch (error) {
    console.error('删除Flow错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;