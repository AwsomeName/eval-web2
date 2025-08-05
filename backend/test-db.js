const pool = require('./config/database');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('数据库连接成功:', result.rows[0]);
    console.log('连接信息:', {
      host: pool.options.host,
      port: pool.options.port,
      database: pool.options.database,
      user: pool.options.user
    });
    
    // 检查表是否存在
    try {
      console.log('\n检查表是否存在:');
      const tables = ['models', 'datasets', 'flows', 'agents', 'leaderboards'];
      
      for (const table of tables) {
        try {
          const tableResult = await pool.query(`SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table}'
          )`);
          
          console.log(`${table} 表是否存在:`, tableResult.rows[0].exists);
          
          if (tableResult.rows[0].exists) {
            const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`${table} 表中的记录数:`, countResult.rows[0].count);
          }
        } catch (tableError) {
          console.error(`检查 ${table} 表时出错:`, tableError.message);
        }
      }
    } catch (tablesError) {
      console.error('检查表时出错:', tablesError);
    }
  } catch (error) {
    console.error('数据库连接失败:', error);
  } finally {
    process.exit(0);
  }
}

testConnection();