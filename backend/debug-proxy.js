const express = require('express');
const axios = require('axios');

// 创建Express应用
const app = express();
app.use(express.json());

// 简单的认证中间件（用于调试）
const debugAuthMiddleware = (req, res, next) => {
  console.log('🔐 调试模式 - 跳过认证检查');
  next();
};

// 创建调试版本的路由
const router = express.Router();

// 代理聊天完成API请求 - 调试版本
router.post('/chat/completions', debugAuthMiddleware, async (req, res) => {
  console.log('\n🚀 开始调试 /chat/completions 路由');
  console.log('📝 请求体:', JSON.stringify(req.body, null, 2));
  
  try {
    let { accessUrl, accessKey, requestBody } = req.body;
    
    console.log('\n🔍 参数验证:');
    console.log(`accessUrl: ${accessUrl ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`accessKey: ${accessKey ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`requestBody: ${requestBody ? '✅ 存在' : '❌ 缺失'}`);
    
    // 清理URL，去除可能的空格和特殊字符
    if (accessUrl) {
      console.log('\n🧹 URL清理前:', `'${accessUrl}'`);
      accessUrl = accessUrl.trim().replace(/[`'"\s]/g, '');
      console.log('🧹 URL清理后:', `'${accessUrl}'`);
    }
    
    if (!accessUrl || !accessKey || !requestBody) {
      console.log('❌ 参数验证失败');
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 添加日志，记录实际请求的URL和KEY（部分隐藏）
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('\n📊 请求API详情:');
    console.log(`URL: '${accessUrl}'`);
    console.log(`KEY: ${maskedKey}`);
    console.log(`Model: ${requestBody.model || 'N/A'}`);
    console.log(`Stream: ${requestBody.stream ? '✅ 是' : '❌ 否'}`);
    
    // URL格式验证
    try {
      new URL(accessUrl);
      console.log('✅ URL格式验证通过');
    } catch (urlError) {
      console.log('❌ URL格式无效:', urlError.message);
      return res.status(400).json({ error: 'URL格式无效' });
    }
    
    console.log('\n⏳ 开始发送API请求...');
    const startTime = Date.now();
    
    // 发送请求
    const response = await axios({
      method: 'POST',
      url: accessUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`,
        'Accept': requestBody.stream ? 'text/event-stream' : 'application/json'
      },
      data: requestBody,
      responseType: requestBody.stream ? 'stream' : 'json',
      timeout: 30000
    });
    
    const endTime = Date.now();
    console.log(`⚡ API响应时间: ${endTime - startTime}ms`);
    console.log(`📊 响应状态: ${response.status} ${response.statusText}`);
    
    if (requestBody.stream) {
      console.log('🌊 开始流式响应传输...');
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      response.data.on('data', (chunk) => {
        console.log('📦 接收数据块:', chunk.length, '字节');
      });
      
      response.data.on('end', () => {
        console.log('✅ 流式响应完成');
      });
      
      response.data.pipe(res);
    } else {
      console.log('📋 响应数据大小:', JSON.stringify(response.data).length, '字符');
      res.json(response.data);
    }
    
  } catch (error) {
    const endTime = Date.now();
    console.log('❌ API请求失败:', error.message);
    
    if (error.response) {
      console.log('📊 错误状态:', error.response.status, error.response.statusText);
      console.log('📋 错误响应:', error.response.data);
      
      return res.status(error.response.status).json({
        error: '代理请求失败',
        message: error.message,
        status: error.response.status,
        statusText: error.response.statusText
      });
    }
    
    res.status(500).json({ 
      error: '代理请求失败', 
      message: error.message 
    });
  }
});

// 模型测试路由 - 调试版本
router.post('/model/test', debugAuthMiddleware, async (req, res) => {
  console.log('\n🤖 开始调试 /model/test 路由');
  console.log('📝 请求体:', JSON.stringify(req.body, null, 2));
  
  try {
    const { modelInfo, messages, options } = req.body;
    
    console.log('\n🔍 参数验证:');
    console.log(`modelInfo: ${modelInfo ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`messages: ${messages ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`options: ${options ? '✅ 存在' : '❌ 缺失'}`);
    
    if (!modelInfo || !messages) {
      console.log('❌ 参数验证失败');
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    let { accessUrl, accessKey, modelName } = modelInfo;
    
    // 清理URL
    if (accessUrl) {
      console.log('\n🧹 URL清理前:', `'${accessUrl}'`);
      accessUrl = accessUrl.trim().replace(/[`'"\s]/g, '');
      console.log('🧹 URL清理后:', `'${accessUrl}'`);
    }
    
    if (!accessUrl || !accessKey || !modelName) {
      console.log('❌ 模型信息验证失败');
      return res.status(400).json({ error: '缺少模型信息' });
    }
    
    // 构建请求体
    const requestBody = {
      model: modelName,
      messages: messages,
      ...options
    };
    
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('\n📊 模型测试详情:');
    console.log(`URL: '${accessUrl}'`);
    console.log(`KEY: ${maskedKey}`);
    console.log(`Model: ${modelName}`);
    console.log(`Stream: ${options?.stream ? '✅ 是' : '❌ 否'}`);
    
    console.log('\n⏳ 开始模型测试请求...');
    const startTime = Date.now();
    
    const response = await axios({
      method: 'POST',
      url: accessUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`,
        'Accept': options?.stream ? 'text/event-stream' : 'application/json'
      },
      data: requestBody,
      responseType: options?.stream ? 'stream' : 'json',
      timeout: 30000
    });
    
    const endTime = Date.now();
    console.log(`⚡ 模型测试响应时间: ${endTime - startTime}ms`);
    console.log(`📊 响应状态: ${response.status} ${response.statusText}`);
    
    if (options?.stream) {
      console.log('🌊 开始流式响应传输...');
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      response.data.pipe(res);
    } else {
      console.log('📋 响应数据大小:', JSON.stringify(response.data).length, '字符');
      res.json(response.data);
    }
    
  } catch (error) {
    console.log('❌ 模型测试失败:', error.message);
    
    if (error.response) {
      console.log('📊 错误状态:', error.response.status, error.response.statusText);
      
      return res.status(error.response.status).json({
        error: '模型测试失败',
        message: error.message,
        status: error.response.status,
        statusText: error.response.statusText
      });
    }
    
    res.status(500).json({ 
      error: '模型测试失败', 
      message: error.message 
    });
  }
});

// 健康检查路由
router.get('/health', (req, res) => {
  console.log('\n💚 健康检查');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Proxy路由调试服务正常运行'
  });
});

// 使用路由
app.use('/api/proxy', router);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Proxy路由调试服务',
    endpoints: [
      'GET  /api/proxy/health - 健康检查',
      'POST /api/proxy/chat/completions - 聊天完成API代理',
      'POST /api/proxy/model/test - 模型测试'
    ],
    usage: {
      'chat/completions': {
        method: 'POST',
        body: {
          accessUrl: 'https://api.example.com/v1/chat/completions',
          accessKey: 'your-api-key',
          requestBody: {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello' }],
            stream: false
          }
        }
      },
      'model/test': {
        method: 'POST',
        body: {
          modelInfo: {
            accessUrl: 'https://api.example.com/v1/chat/completions',
            accessKey: 'your-api-key',
            modelName: 'gpt-3.5-turbo'
          },
          messages: [{ role: 'user', content: 'Hello' }],
          options: {
            stream: true,
            temperature: 0.7,
            max_tokens: 1000
          }
        }
      }
    }
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('\n❌ 全局错误处理:', error);
  res.status(500).json({
    error: '服务器内部错误',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  console.log(`\n❓ 404: ${req.method} ${req.path}`);
  res.status(404).json({
    error: '路由未找到',
    method: req.method,
    path: req.path,
    availableEndpoints: [
      'GET  /',
      'GET  /api/proxy/health',
      'POST /api/proxy/chat/completions',
      'POST /api/proxy/model/test'
    ]
  });
});

const PORT = process.env.DEBUG_PORT || 3001;

app.listen(PORT, () => {
  console.log('\n🚀 Proxy路由调试服务启动成功!');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log('\n📋 可用端点:');
  console.log(`   GET  http://localhost:${PORT}/ - 服务信息`);
  console.log(`   GET  http://localhost:${PORT}/api/proxy/health - 健康检查`);
  console.log(`   POST http://localhost:${PORT}/api/proxy/chat/completions - 聊天完成API代理`);
  console.log(`   POST http://localhost:${PORT}/api/proxy/model/test - 模型测试`);
  console.log('\n💡 调试提示:');
  console.log('   - 所有请求和响应都会详细记录在控制台');
  console.log('   - 认证检查已跳过，便于调试');
  console.log('   - 使用 Ctrl+C 停止服务');
  console.log('\n' + '='.repeat(60));
});

module.exports = app;