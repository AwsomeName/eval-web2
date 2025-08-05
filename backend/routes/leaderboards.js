const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 配置文件上传
const upload = multer({
  dest: '/tmp/',
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传CSV文件'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 获取所有榜单
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT l.*, u.username as created_by_name 
      FROM leaderboards l 
      LEFT JOIN users u ON l.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (l.name ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) FROM leaderboards l WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;
    
    if (search) {
      countQuery += ` AND (l.name ILIKE $${countParamIndex} OR l.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      leaderboards: result.rows,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取榜单列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个榜单
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT l.*, u.username as created_by_name 
      FROM leaderboards l 
      LEFT JOIN users u ON l.created_by = u.id 
      WHERE l.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '榜单不存在' });
    }

    const leaderboard = result.rows[0];
    
    // 获取榜单结果
    const resultsQuery = await pool.query(`
      SELECT lr.*, m.name as model_name, d.name as dataset_name
      FROM leaderboard_results lr
      JOIN models m ON lr.model_id = m.id
      JOIN datasets d ON lr.dataset_id = d.id
      WHERE lr.leaderboard_id = $1
      ORDER BY lr.score DESC
    `, [id]);

    res.json({
      ...leaderboard,
      results: resultsQuery.rows
    });
  } catch (error) {
    console.error('获取榜单详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建榜单
router.post('/', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const {
      name,
      description,
      publisher,
      dataset_ids,
      model_ids
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: '榜单名称不能为空' });
    }

    const result = await pool.query(`
      INSERT INTO leaderboards (name, description, publisher, dataset_ids, model_ids, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, description, publisher, dataset_ids || [], model_ids || [], req.user.id]);

    res.status(201).json({
      message: '榜单创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('创建榜单错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新榜单
router.put('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      publisher,
      dataset_ids,
      model_ids
    } = req.body;

    // 检查榜单是否存在
    const existingLeaderboard = await pool.query('SELECT * FROM leaderboards WHERE id = $1', [id]);
    if (existingLeaderboard.rows.length === 0) {
      return res.status(404).json({ error: '榜单不存在' });
    }

    // 检查权限
    if (req.user.role !== 'admin' && existingLeaderboard.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    const result = await pool.query(`
      UPDATE leaderboards 
      SET name = $1, description = $2, publisher = $3, dataset_ids = $4, model_ids = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, description, publisher, dataset_ids || [], model_ids || [], id]);

    res.json({
      message: '榜单更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('更新榜单错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除榜单
router.delete('/:id', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;

    // 检查榜单是否存在
    const existingLeaderboard = await pool.query('SELECT * FROM leaderboards WHERE id = $1', [id]);
    if (existingLeaderboard.rows.length === 0) {
      return res.status(404).json({ error: '榜单不存在' });
    }

    // 检查权限
    if (req.user.role !== 'admin' && existingLeaderboard.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: '权限不足' });
    }

    await pool.query('DELETE FROM leaderboards WHERE id = $1', [id]);

    res.json({ message: '榜单删除成功' });
  } catch (error) {
    console.error('删除榜单错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 添加或更新榜单结果
router.post('/:id/results', authenticateToken, requireRole(['admin', 'developer']), async (req, res) => {
  try {
    const { id } = req.params;
    const { model_id, dataset_id, score, metrics } = req.body;

    if (!model_id || !dataset_id || score === undefined) {
      return res.status(400).json({ error: '模型ID、数据集ID和分数不能为空' });
    }

    // 检查是否已存在相同的结果，如果存在则更新
    const existingResult = await pool.query(`
      SELECT id FROM leaderboard_results 
      WHERE leaderboard_id = $1 AND model_id = $2 AND dataset_id = $3
    `, [id, model_id, dataset_id]);

    let result;
    if (existingResult.rows.length > 0) {
      // 更新现有结果
      result = await pool.query(`
        UPDATE leaderboard_results 
        SET score = $1, metrics = $2, created_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [score, metrics || {}, existingResult.rows[0].id]);
    } else {
      // 创建新结果
      result = await pool.query(`
        INSERT INTO leaderboard_results (leaderboard_id, model_id, dataset_id, score, metrics)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [id, model_id, dataset_id, score, metrics || {}]);
    }

    res.status(201).json({
      message: '榜单结果保存成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('添加榜单结果错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 导入CSV结果
router.post('/:id/import', authenticateToken, requireRole(['admin', 'developer']), upload.single('csvFile'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: '请选择CSV文件' });
    }

    const csvContent = fs.readFileSync(req.file.path, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV文件格式不正确' });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 3) {
        const [model_id, dataset_id, score, ...metricValues] = values;
        const metrics = {};
        
        // 将额外的列作为指标
        metricValues.forEach((value, index) => {
          if (headers[index + 3]) {
            metrics[headers[index + 3]] = value;
          }
        });

        results.push({
          model_id: parseInt(model_id),
          dataset_id: parseInt(dataset_id),
          score: parseFloat(score),
          metrics
        });
      }
    }

    // 批量插入结果
    for (const result of results) {
      await pool.query(`
        INSERT INTO leaderboard_results (leaderboard_id, model_id, dataset_id, score, metrics)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (leaderboard_id, model_id, dataset_id) 
        DO UPDATE SET score = $4, metrics = $5, created_at = CURRENT_TIMESTAMP
      `, [id, result.model_id, result.dataset_id, result.score, result.metrics]);
    }

    // 清理临时文件
    fs.unlinkSync(req.file.path);

    res.json({
      message: `成功导入${results.length}条榜单结果`,
      count: results.length
    });
  } catch (error) {
    console.error('导入CSV错误:', error);
    
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: '服务器错误' });
  }
});

// 导出CSV结果
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    
    const results = await pool.query(`
      SELECT lr.*, m.name as model_name, d.name as dataset_name
      FROM leaderboard_results lr
      JOIN models m ON lr.model_id = m.id
      JOIN datasets d ON lr.dataset_id = d.id
      WHERE lr.leaderboard_id = $1
      ORDER BY lr.score DESC
    `, [id]);

    if (results.rows.length === 0) {
      return res.status(404).json({ error: '没有找到榜单结果' });
    }

    // 生成CSV内容
    let csvContent = 'model_id,model_name,dataset_id,dataset_name,score\n';
    
    results.rows.forEach(row => {
      csvContent += `${row.model_id},${row.model_name},${row.dataset_id},${row.dataset_name},${row.score}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leaderboard_${id}_results.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('导出CSV错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;