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
        console.error('流式响应错误:', error);
        
        // 直接发送简单错误响应
        if (!res.headersSent) {
          try {
            // 提取错误状态和信息
            const status = error.response ? error.response.status : 500;
            const message = error.message || '流式响应错误';
            
            // 尝试获取响应数据
            let responseData = null;
            if (error.response && error.response.data) {
              if (Buffer.isBuffer(error.response.data)) {
                responseData = error.response.data.toString('utf8');
              } else if (typeof error.response.data === 'string') {
                responseData = error.response.data;
              } else {
                responseData = JSON.stringify(error.response.data);
              }
              console.error('API错误响应数据:', responseData);
            }

            // 构建错误响应
            const errorResponse = {
              error: '代理请求失败',
              status: status,
              message: message
            };

            // 如果有响应数据，添加到错误响应中
            if (responseData) {
              errorResponse.responseData = responseData;
            }

            // 发送错误响应
            res.status(status).json(errorResponse);
          } catch (e) {
            console.error('构建错误响应失败:', e);
            res.status(500).json({
              error: '代理请求失败',
              message: '无法构建错误响应',
              status: 500
            });
          }
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
      
      // 直接构建简单的错误响应
      if (!res.headersSent) {
        try {
          // 提取错误状态和信息
          const status = error.response ? error.response.status : 500;
          const message = error.message || '代理请求错误';
          
          // 尝试获取响应数据
          let responseData = null;
          if (error.response && error.response.data) {
            if (Buffer.isBuffer(error.response.data)) {
              responseData = error.response.data.toString('utf8');
            } else if (typeof error.response.data === 'string') {
              responseData = error.response.data;
            } else {
              try {
                responseData = JSON.stringify(error.response.data);
              } catch (e) {
                console.error('响应数据序列化失败:', e);
                responseData = '无法序列化响应数据';
              }
            }
            console.error('API错误响应数据:', responseData);
          }

          // 构建错误响应
          const errorResponse = {
            error: '代理请求失败',
            status: status,
            message: message
          };

          // 如果有响应数据，添加到错误响应中
          if (responseData) {
            errorResponse.responseData = responseData;
          }

          // 发送错误响应
          res.status(status).json(errorResponse);
        } catch (e) {
          console.error('构建错误响应失败:', e);
          res.status(500).json({
            error: '代理请求失败',
            message: '无法构建错误响应',
            status: 500
          });
        }
      }
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
              url: `data:image/${img.format};base64,${img.data}` // 修复file未定义错误
            }))
          };
        }
        return msg;
      });
    }
    
    // 添加日志
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('模型测试请求详情:');
    console.log(`URL: '${accessUrl}'`);
    console.log(`URL长度: ${accessUrl.length}`);
    // console.log(`URL字符编码:`, Array.from(accessUrl).map(c => c.charCodeAt(0)));
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
            // 使用自定义序列化函数处理可能的循环引用和二进制数据
            const serializeError = (obj, seen = new WeakSet()) => {
              if (obj === null || typeof obj !== 'object') {
                // 处理Buffer或二进制数据
                if (Buffer.isBuffer(obj)) {
                  return obj.toString('utf8'); // 尝试转换为字符串
                }
                return obj;
              }
              if (seen.has(obj)) {
                return '[Circular]';
              }
              seen.add(obj);
              const result = Array.isArray(obj) ? [] : {};
              for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                  result[key] = serializeError(obj[key], seen);
                }
              }
              seen.delete(obj);
              return result;
            };
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

// 代理图像生成API请求
router.post('/image/generation', authenticateToken, async (req, res) => {
  try {
    const { modelInfo, requestBody } = req.body;
    
    if (!modelInfo || !requestBody) {
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
    
    // 构建请求URL，支持不同的API端点格式
    let requestUrl;
    if (accessUrl.includes('siliconflow.cn')) {
      // SiliconFlow API使用/v1/images/generations端点
      if (accessUrl.includes('/images/generations')) {
        // 如果URL已经包含images/generations路径，直接使用
        requestUrl = accessUrl;
      } else {
        // 如果URL不包含images/generations路径，添加它
        requestUrl = accessUrl.endsWith('/') ? 
          accessUrl + 'images/generations' : 
          accessUrl + '/images/generations';
      }
    } else {
      // 其他API（如OpenAI格式）
      if (accessUrl.includes('/images/generations')) {
        requestUrl = accessUrl;
      } else {
        requestUrl = accessUrl + '/images/generations';
      }
    }
    
    // 添加日志
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('图像生成请求详情:');
    console.log(`URL: '${requestUrl}'`);
    console.log(`KEY: ${maskedKey}`);
    console.log(`模型: ${modelName}`);
    
    // 发送请求到目标API
    const response = await axios({
      method: 'post',
      url: requestUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`
      },
      data: requestBody
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('图像生成请求错误:', error);
    
    // 如果有来自目标API的响应，则转发该响应
    if (error.response) {
      try {
        const sanitizedError = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
        
        return res.status(error.response.status).json(sanitizedError);
      } catch (serializationError) {
        console.error('错误序列化失败:', serializationError);
        return res.status(500).json({ 
          error: '图像生成失败', 
          message: error.message,
          responseStatus: error.response ? error.response.status : undefined,
          responseStatusText: error.response ? error.response.statusText : undefined
        });
      }
    }
    
    res.status(500).json({ error: '图像生成失败', message: error.message });
  }
});

module.exports = router;