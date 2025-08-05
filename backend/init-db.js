const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 与项目使用相同的数据库配置
const pool = require('./config/database');

async function initializeDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 读取SQL初始化文件
    const sqlFilePath = path.join(__dirname, 'config', 'init.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 执行SQL脚本
    await pool.query(sqlScript);
    
    console.log('数据库初始化成功!');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    process.exit(0); // 脚本执行完毕后退出
  }
}

initializeDatabase();