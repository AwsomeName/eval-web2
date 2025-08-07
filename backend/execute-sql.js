const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

async function executeSqlFile(filePath) {
  try {
    console.log(`开始执行SQL文件: ${filePath}...`);
    
    // 读取SQL文件
    const sqlScript = fs.readFileSync(filePath, 'utf8');
    
    // 执行SQL脚本
    await pool.query(sqlScript);
    
    console.log('SQL文件执行成功!');
  } catch (error) {
    console.error('SQL文件执行失败:', error);
  } finally {
    process.exit(0); // 脚本执行完毕后退出
  }
}

// 获取命令行参数中的SQL文件路径
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.error('请提供SQL文件路径');
  process.exit(1);
}

executeSqlFile(sqlFilePath);