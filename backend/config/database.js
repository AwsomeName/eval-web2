// 添加缺失的Pool导入
const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5434,
  user: 'model_test',
  password: 'QAdKftmknsmQ4pCm',
  database: 'model_test',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;