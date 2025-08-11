const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../../middleware/auth');
const { cleanUrl, maskApiKey, setStreamHeaders, handleStreamError, handleApiError, serializeError } = require('./utils');

const router = express.Router();

// 代理聊天完成API请求
router.post('/completions', authenticateToken, async (req, res) => {
  try {
    let { accessUrl, accessKey, requestBody } = req.body;
    
    // 清理URL，去除可能的空格和特殊字符
    if (accessUrl) {
      accessUrl = cleanUrl(accessUrl);
    }
    
    if (!accessUrl || !accessKey || !requestBody) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 添加日志，记录实际请求的URL和KEY（部分隐藏）
    const maskedKey = maskApiKey(accessKey);
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
      setStreamHeaders(res);
      
      // 添加响应数据事件监听，用于调试
      response.data.on('data', (chunk) => {
        console.log('接收到流式数据:', chunk.toString('utf8').substring(0, 100) + '...');
      });

      // 转发流式响应
      response.data.pipe(res);

      // 响应结束事件
      response.data.on('end', () => {
        console.log('流式响应结束');
      });

      // 错误处理
      response.data.on('error', (error) => {
        handleStreamError(error, res, '聊天完成');
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
    handleStreamError(error, res, '聊天完成');
  }
});

// 新的模型测试路由 - 接收模型信息并进行流式请求
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { modelInfo, messages, options } = req.body;
    
    if (!modelInfo || !messages || !options) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    let { accessUrl, accessKey, modelName } = modelInfo;
    
    // 清理URL，去除可能的空格和特殊字符
    if (accessUrl) {
      accessUrl = cleanUrl(accessUrl);
    }
    
    if (!accessUrl || !accessKey || !modelName) {
      return res.status(400).json({ error: '模型信息不完整' });
    }
    
    // 构建请求体
    const requestBody = {
      model: modelName,
      messages: messages,
      // 根据模型类型动态调整请求参数
      ...(options || {})
    };
    
    // 对于阿里云Qwen模型，可能需要添加特定参数
    if (modelName.includes('qwen') || modelName.includes('Qwen')) {
      // 添加阿里云模型需要的参数
      requestBody.temperature = options.temperature || 0.7;
      requestBody.max_tokens = options.max_tokens || 1000;
      // 确保多模态数据格式正确
      requestBody.messages = messages.map(msg => {
        if (msg.images && msg.images.length > 0) {
          // 调整images格式以适应阿里云API
          return {
            ...msg,
            images: msg.images.map(img => ({
              ...img,
              url: `data:image/${img.format};base64,${img.data}`
            }))
          };
        }
        return msg;
      });
    }
    
    // 添加日志
    const maskedKey = maskApiKey(accessKey);
    console.log('模型测试请求详情:');
    console.log(`URL: '${accessUrl}'`);
    console.log(`URL长度: ${accessUrl.length}`);
    console.log(`KEY: ${accessKey}`);
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
      setStreamHeaders(res);
      
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
            sanitizedError.data = serializeError(error.response.data);
          } catch (jsonError) {
            // 详细记录序列化错误，便于调试
            console.error('响应数据序列化失败:', jsonError, '原始数据:', error.response.data);
            sanitizedError.data = {
              error: '无法序列化响应数据',
              message: jsonError.message,
              // 提供原始数据的类型信息，帮助调试
              originalDataType: typeof error.response.data,
              isBuffer: Buffer.isBuffer(error.response.data)
            };
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