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
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, publisher, model_name, model_type, access_url, access_key, system_prompt } = req.body;

        // 添加调试日志
        console.log('提交的model_type值:', model_type);
        console.log('提交的model_type类型:', typeof model_type);
        console.log('允许的model_type值:', [
            'text', 'image', 'video', 'asr', 'tts', 'embedding', 'rerank', 'audio', 'world', 'autonomous_driving', 'multimodal'
        ]);

        // 验证必填字段
        if (!name || !model_type) {
            return res.status(400).json({ error: '名称和模型类型为必填项' });
        }

        // 规范化model_type值以确保匹配约束
        const normalizedModelType = model_type.trim().toLowerCase();
        
        // 验证model_type是否在允许的值列表中
        const allowedTypes = ['text', 'image', 'video', 'asr', 'tts', 'embedding', 'rerank', 'audio', 'world', 'autonomous_driving', 'multimodal', 'text2image'];
        if (!allowedTypes.includes(normalizedModelType)) {
            return res.status(400).json({ error: `模型类型必须是以下值之一: ${allowedTypes.join(', ')}` });
        }

        // 执行数据库插入
        // 更详细的调试日志
        console.log('提交的model_type值(规范化后):', normalizedModelType);
        console.log('插入语句:', `INSERT INTO models (name, description, publisher, model_name, model_type, access_url, access_key, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`);
        console.log('插入参数:', [name, description, publisher, model_name, normalizedModelType, api_url, api_key, req.user.id]);
        
        const result = await pool.query(
            `INSERT INTO models (name, description, publisher, model_name, model_type, access_url, access_key, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, description, publisher, model_name, normalizedModelType, access_url, access_key, req.user.id]
        );

    res.status(201).json({
      message: '模型创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('创建模型详细错误:', error.message, error.stack);
    res.status(500).json({ error: '服务器错误: ' + error.message });
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