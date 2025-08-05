const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 获取所有Agent
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT a.*, u.username as created_by_name 
      FROM agents a 
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND a.agent_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (a.name ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM agents a WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;
    
    if (type) {
      countQuery += ` AND a.agent_type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (a.name ILIKE $${countParamIndex} OR a.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      agents: result.rows,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取Agent列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个Agent
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT a.*, u.username as created_by_name 
      FROM agents a 
      LEFT JOIN users u ON a.created_by = u.id 
      WHERE a.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取Agent详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建Agent
router.post('/', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const {
      name,
      description,
      publisher,
      agent_type,
      access_url,
      input_format,
      output_format
    } = req.body;

    if (!name || !agent_type) {
      return res.status(400).json({ error: 'Agent名称和类型不能为空' });
    }

    const result = await pool.query(`
      INSERT INTO agents (name, description, publisher, agent_type, access_url, input_format, output_format, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, description, publisher, agent_type, access_url, input_format, output_format, req.user.id]);

    res.status(201).json({
      message: 'Agent创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('创建Agent错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新Agent
router.put('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      publisher,
      agent_type,
      access_url,
      input_format,
      output_format
    } = req.body;

    // 检查Agent是否存在
    const existingAgent = await pool.query('SELECT * FROM agents WHERE id = $1', [id]);
    if (existingAgent.rows.length === 0) {
      return res.status(404).json({ error: 'Agent不存在' });
    }

    // 检查权限
    if (req.user.role !== 'admin' && existingAgent.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    const result = await pool.query(`
      UPDATE agents 
      SET name = $1, description = $2, publisher = $3, agent_type = $4,
          access_url = $5, input_format = $6, output_format = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [name, description, publisher, agent_type, access_url, input_format, output_format, id]);

    res.json({
      message: 'Agent更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('更新Agent错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除Agent
router.delete('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查Agent是否存在
    const existingAgent = await pool.query('SELECT * FROM agents WHERE id = $1', [id]);
    if (existingAgent.rows.length === 0) {
      return res.status(404).json({ error: 'Agent不存在' });
    }

    // 检查权限
    if (req.user.role !== 'admin' && existingAgent.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    await pool.query('DELETE FROM agents WHERE id = $1', [id]);

    res.json({ message: 'Agent删除成功' });
  } catch (error) {
    console.error('删除Agent错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;