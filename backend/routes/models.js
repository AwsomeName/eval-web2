const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 获取所有模型
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT m.*, u.username as created_by_name 
      FROM models m 
      LEFT JOIN users u ON m.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND m.model_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (search) {
      query += ` AND (m.name ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM models m WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;
    
    if (type) {
      countQuery += ` AND m.model_type = $${countParamIndex}`;
      countParams.push(type);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (m.name ILIKE $${countParamIndex} OR m.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      models: result.rows,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取模型列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个模型
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT m.*, u.username as created_by_name 
      FROM models m 
      LEFT JOIN users u ON m.created_by = u.id 
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '模型不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取模型详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建模型
router.post('/', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const {
      name,
      description,
      publisher,
      model_type,
      model_name,
      access_url,
      access_key,
      input_format,
      output_format,
      example
    } = req.body;

    if (!name || !model_type) {
      return res.status(400).json({ error: '模型名称和类型不能为空' });
    }

    const result = await pool.query(`
      INSERT INTO models (name, description, publisher, model_type, model_name, access_url, access_key, input_format, output_format, example, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [name, description, publisher, model_type, model_name, access_url, access_key, input_format, output_format, example, req.user.id]);

    res.status(201).json({
      message: '模型创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('创建模型错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新模型
router.put('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      publisher,
      model_type,
      model_name,
      access_url,
      access_key,
      input_format,
      output_format,
      example
    } = req.body;

    // 检查模型是否存在
    const existingModel = await pool.query('SELECT * FROM models WHERE id = $1', [id]);
    if (existingModel.rows.length === 0) {
      return res.status(404).json({ error: '模型不存在' });
    }

    // 检查权限（只有创建者或管理员可以修改）
    if (req.user.role !== 'admin' && existingModel.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    const result = await pool.query(`
      UPDATE models 
      SET name = $1, description = $2, publisher = $3, model_type = $4, 
          model_name = $5, access_url = $6, access_key = $7, input_format = $8, 
          output_format = $9, example = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [name, description, publisher, model_type, model_name, access_url, access_key, input_format, output_format, example, id]);

    res.json({
      message: '模型更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('更新模型错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除模型
router.delete('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查模型是否存在
    const existingModel = await pool.query('SELECT * FROM models WHERE id = $1', [id]);
    if (existingModel.rows.length === 0) {
      return res.status(404).json({ error: '模型不存在' });
    }

    // 检查权限（只有创建者或管理员可以删除）
    if (req.user.role !== 'admin' && existingModel.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    await pool.query('DELETE FROM models WHERE id = $1', [id]);

    res.json({ message: '模型删除成功' });
  } catch (error) {
    console.error('删除模型错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;