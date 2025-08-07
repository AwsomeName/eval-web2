const pool = require('./config/database');

async function checkConstraint() {
  try {
    // 查询模型表的model_type约束定义
    const constraintResult = await pool.query(
      "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'models_model_type_check'"
    );
    
    console.log('当前model_type约束定义:', constraintResult.rows);
    
    // 查询models表结构
    const tableResult = await pool.query(
      "SELECT column_name, data_type, is_nullable \
       FROM information_schema.columns \
       WHERE table_name = 'models'"
    );
    
    console.log('models表结构:', tableResult.rows);
    
    // 查询models表中所有行的model_type值
    const modelsResult = await pool.query(
      "SELECT id, name, model_type FROM models"
    );
    
    console.log('当前模型数据:', modelsResult.rows);
    
    // 查找不符合约束的model_type值
    const allowedTypes = ['text', 'image', 'video', 'asr', 'tts', 'embedding', 'rerank', 'audio', 'world', 'autonomous_driving', 'multimodal'];
    const invalidModels = modelsResult.rows.filter(row => {
      // 检查model_type是否为null或不在允许列表中
      return !row.model_type || !allowedTypes.includes(row.model_type.trim().toLowerCase());
    });
    
    if (invalidModels.length > 0) {
      console.log('发现违反约束的行:', invalidModels);
      console.log('解决方案: 更新这些行的model_type值为有效值，或者从数据库中删除这些行');
      
      // 生成修复SQL（作为示例，将无效值更新为'text'）
      for (const model of invalidModels) {
        console.log(`-- 修复SQL示例: UPDATE models SET model_type = 'text' WHERE id = ${model.id};`);
      }
    } else {
      console.log('未发现违反约束的行，但仍然无法应用新约束，可能存在空格或大小写问题');
      
      // 检查空格或大小写问题
      const potentialIssueModels = modelsResult.rows.filter(row => {
        return row.model_type && row.model_type !== row.model_type.trim().toLowerCase();
      });
      
      if (potentialIssueModels.length > 0) {
        console.log('发现可能存在空格或大小写问题的行:', potentialIssueModels);
        
        // 生成规范化SQL
        for (const model of potentialIssueModels) {
          console.log(`-- 规范化SQL: UPDATE models SET model_type = '${model.model_type.trim().toLowerCase()}' WHERE id = ${model.id};`);
        }
      }
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkConstraint();