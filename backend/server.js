const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors({
  // origin: true,
  origin: [
    'http://localhost:3001', 
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://tty.woniucoder.cn:35174', 
    'http://tty.woniucoder.cn:3001', 
    'http://mt.tty.woniucoder.cn', 
    'https://mt.tty.woniucoder.cn'
    // 在这里添加新的域名
    // 'http://your-new-domain.com'
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个IP最多100次请求
});
app.use('/api', limiter);

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/models', require('./routes/models'));
app.use('/api/datasets', require('./routes/datasets'));
app.use('/api/flows', require('./routes/flows'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/leaderboards', require('./routes/leaderboards'));
app.use('/api/proxy', require('./routes/proxy')); // 添加代理路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 统计数据接口
app.get('/api/stats', async (req, res) => {
  try {
    const pool = require('./config/database');
    
    const modelsCount = await pool.query('SELECT COUNT(*) FROM models');
    const datasetsCount = await pool.query('SELECT COUNT(*) FROM datasets');
    const flowsCount = await pool.query('SELECT COUNT(*) FROM flows');
    const agentsCount = await pool.query('SELECT COUNT(*) FROM agents');
    const leaderboardsCount = await pool.query('SELECT COUNT(*) FROM leaderboards');
    
    res.json({
      models: parseInt(modelsCount.rows[0].count, 10),
      datasets: parseInt(datasetsCount.rows[0].count, 10),
      flows: parseInt(flowsCount.rows[0].count, 10),
      agents: parseInt(agentsCount.rows[0].count, 10),
      leaderboards: parseInt(leaderboardsCount.rows[0].count, 10)
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '路径不存在' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});