const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 代理聊天完成API请求
router.post('/chat/completions', authenticateToken, async (req, res) => {
  try {
    let { accessUrl, accessKey, requestBody } = req.body;
    
    // 清理URL，去除可能的空格和特殊字符
    if (accessUrl) {
      accessUrl = accessUrl.trim().replace(/[`'"\s]/g, '');
    }
    
    if (!accessUrl || !accessKey || !requestBody) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 添加日志，记录实际请求的URL和KEY（部分隐藏）
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('请求API详情:');
    console.log(`URL: '${accessUrl}'`);
    console.log(`URL长度: ${accessUrl.length}`);
    console.log(`URL字符编码:`, Array.from(accessUrl).map(c => c.charCodeAt(0)));
    console.log(`KEY: ${maskedKey}`);
    console.log(`模型: ${requestBody.model}`);
    
    // 处理流式响应
    if (requestBody.stream) {
      const response = await axios({
        method: 'post',
        url: accessUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessKey}`
        },
        data: requestBody,
        responseType: 'stream'
      });
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // 转发流式响应
      response.data.pipe(res);
      
      // 错误处理
      response.data.on('error', (error) => {
        console.error('流式响应错误:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: '流式响应错误' });
        }
      });
    } else {
      // 处理非流式响应
      const response = await axios({
        method: 'post',
        url: accessUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessKey}`
        },
        data: requestBody
      });
      
      res.json(response.data);
    }
  } catch (error) {
    console.error('代理请求错误:', error);
    
    // 如果有来自目标API的响应，则转发该响应
    if (error.response) {
      try {
        // 避免循环引用导致的JSON序列化错误
        const sanitizedError = {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers ? JSON.parse(JSON.stringify(error.response.headers)) : undefined
        };
        
        // 安全处理data字段，避免循环引用
        if (error.response.data) {
          try {
            // 尝试JSON序列化/反序列化data
            sanitizedError.data = JSON.parse(JSON.stringify(error.response.data));
          } catch (jsonError) {
            // 如果data无法序列化，提供错误信息
            sanitizedError.data = { error: '无法序列化响应数据', message: jsonError.message };
          }
        }
        
        return res.status(error.response.status).json(sanitizedError);
      } catch (serializationError) {
        // 如果整个错误对象都无法序列化，返回基本错误信息
        console.error('错误序列化失败:', serializationError);
        return res.status(500).json({ 
          error: '代理请求失败', 
          message: error.message,
          responseStatus: error.response ? error.response.status : undefined,
          responseStatusText: error.response ? error.response.statusText : undefined
        });
      }
    }
    
    res.status(500).json({ error: '代理请求失败', message: error.message });
  }
});

// 新的模型测试路由 - 接收模型信息并进行流式请求
router.post('/model/test', authenticateToken, async (req, res) => {
  try {
    const { modelInfo, messages, options } = req.body;
    
    if (!modelInfo || !messages || !options) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    let { accessUrl, accessKey, modelName } = modelInfo;
    
    // 清理URL，去除可能的空格和特殊字符
    if (accessUrl) {
      accessUrl = accessUrl.trim().replace(/[`'"\s]/g, '');
    }
    
    if (!accessUrl || !accessKey || !modelName) {
      return res.status(400).json({ error: '模型信息不完整' });
    }
    
    // 构建请求体
    const requestBody = {
      model: modelName,
      messages: messages,
      stream: options.stream || true,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000
    };
    
    // 添加日志
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('模型测试请求详情:');
    console.log(`URL: '${accessUrl}'`);
    console.log(`URL长度: ${accessUrl.length}`);
    console.log(`URL字符编码:`, Array.from(accessUrl).map(c => c.charCodeAt(0)));
    console.log(`KEY: ${maskedKey}`);
    console.log(`模型: ${modelName}`);
    
    // 处理流式响应
    if (requestBody.stream) {
      const response = await axios({
        method: 'post',
        url: accessUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessKey}`
        },
        data: requestBody,
        responseType: 'stream'
      });
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // 转发流式响应
      response.data.pipe(res);
      
      // 错误处理
      response.data.on('error', (error) => {
        console.error('流式响应错误:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: '流式响应错误' });
        }
      });
    } else {
      // 处理非流式响应
      const response = await axios({
        method: 'post',
        url: accessUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessKey}`
        },
        data: requestBody
      });
      
      res.json(response.data);
    }
  } catch (error) {
    console.error('模型测试请求错误:', error);
    
    // 如果有来自目标API的响应，则转发该响应
    if (error.response) {
      try {
        const sanitizedError = {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers ? JSON.parse(JSON.stringify(error.response.headers)) : undefined
        };
        
        if (error.response.data) {
          try {
            sanitizedError.data = JSON.parse(JSON.stringify(error.response.data));
          } catch (jsonError) {
            sanitizedError.data = { error: '无法序列化响应数据', message: jsonError.message };
          }
        }
        
        return res.status(error.response.status).json(sanitizedError);
      } catch (serializationError) {
        console.error('错误序列化失败:', serializationError);
        return res.status(500).json({ 
          error: '模型测试失败', 
          message: error.message,
          responseStatus: error.response ? error.response.status : undefined,
          responseStatusText: error.response ? error.response.statusText : undefined
        });
      }
    }
    
    res.status(500).json({ error: '模型测试失败', message: error.message });
  }
});

module.exports = router;