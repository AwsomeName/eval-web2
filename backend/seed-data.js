// 添加数据库连接导入
const pool = require('./config/database');

async function seedDatabase() {
  try {
    console.log('开始添加示例数据...');
    
    // 添加模型数据
    await pool.query(`
      INSERT INTO models (name, description, publisher, model_type) VALUES
      ('GPT-4', '强大的自然语言处理模型', 'OpenAI', 'text'),
      ('DALL-E 3', '先进的图像生成模型', 'OpenAI', 'text2image'),
      ('Llama 3', '开源大型语言模型', 'Meta AI', 'text'),
      ('Whisper', '语音识别模型', 'OpenAI', 'audio'),
      ('Claude 3', '多模态AI助手', 'Anthropic', 'multimodal')
    `);
    
    // 添加数据集数据
    await pool.query(`
      INSERT INTO datasets (name, description, publisher, data_type, data_count) VALUES
      ('MMLU', '大规模多任务语言理解数据集', 'EleutherAI', 'classification', 15908),
      ('MS MARCO', '大规模阅读理解数据集', 'Microsoft', 'generation', 1010916),
      ('GSM8K', '小学数学问题数据集', 'OpenAI', 'generation', 8500),
      ('WMT 2023', '机器翻译数据集', 'ACL', 'generation', 36500),
      ('AudioSet', '大规模音频事件数据集', 'Google', 'speech', 2084320)
    `);
    
    // 添加流程数据
    await pool.query(`
      INSERT INTO flows (name, description, publisher, flow_type) VALUES
      ('文本摘要流程', '自动提取长文本关键信息', 'LangChain', 'workflow'),
      ('客服对话流程', '自动处理客户请求并回答问题', 'FlowGPT', 'chatflow'),
      ('数据分析流程', '自动分析数据并生成报告', 'DataRobot', 'workflow'),
      ('多模态内容创建', '结合文本和图像创建内容', 'Runway', 'workflow'),
      ('翻译增强流程', '多语言翻译与润色', 'DeepL', 'chatflow')
    `);
    
    // 添加Agent数据
    await pool.query(`
      INSERT INTO agents (name, description, publisher, agent_type) VALUES
      ('研究助手', '帮助研究人员查找和整理学术资料', 'ResearchHub', 'research'),
      ('营销文案生成器', '自动生成针对不同受众的营销文案', 'CopyAI', 'marketing'),
      ('代码助手', '帮助程序员编写和调试代码', 'GitHub', 'coding'),
      ('数据分析师', '分析数据并提供见解', 'Tableau', 'analytics'),
      ('会话AI', '能够进行长期对话的智能助手', 'Replika', 'conversation')
    `);
    
    // 添加榜单数据
    await pool.query(`
      INSERT INTO leaderboards (name, description, publisher) VALUES
      ('通用语言理解', '评估模型在多样化语言任务上的表现', 'HuggingFace'),
      ('代码生成', '评估模型生成和理解代码的能力', 'CodeForces'),
      ('图像生成质量', '评估模型生成图像的质量和创造性', 'LAION'),
      ('多语言翻译', '评估模型在不同语言间翻译的准确性', 'WMT'),
      ('语音转文本', '评估模型在不同场景下语音识别的准确性', 'CommonVoice')
    `);
    
    console.log('示例数据添加成功!');
  } catch (error) {
    console.error('添加示例数据失败:', error);
  } finally {
    process.exit(0); // 脚本执行完毕后退出
  }
}

seedDatabase();