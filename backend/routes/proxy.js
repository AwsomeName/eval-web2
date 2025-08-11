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

// 代理ASR音频转录API请求
router.post('/audio/transcriptions', authenticateToken, async (req, res) => {
  try {
    const { modelInfo, audioFile } = req.body;
    
    if (!modelInfo || !audioFile) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    let { accessUrl, accessKey, modelName } = modelInfo;
    
    // 清理URL，去除可能的空格和特殊字符
    if (accessUrl) {
      accessUrl = accessUrl.trim().replace(/[`'"\s()\[\]]/g, '');
      // 确保URL以正确的格式结尾
      if (accessUrl.endsWith('/')) {
        accessUrl = accessUrl.slice(0, -1);
      }
    }
    
    // 清理API Key，去除可能的空格、换行符等特殊字符
    if (accessKey) {
      accessKey = accessKey.trim().replace(/[\r\n\t\s]/g, '');
    }
    
    if (!accessUrl || !accessKey || !modelName) {
      return res.status(400).json({ error: '模型信息不完整' });
    }
    
    // URL格式验证
    try {
      new URL(accessUrl);
    } catch (urlError) {
      console.error('URL格式错误:', accessUrl, urlError.message);
      return res.status(400).json({ 
        error: 'API URL格式无效', 
        details: `URL: ${accessUrl}`,
        suggestion: '请检查API URL格式，确保是完整的HTTPS URL'
      });
    }
    
    // 检查是否为硅基流动平台
    if (!accessUrl.includes('siliconflow.cn')) {
      return res.status(400).json({ error: 'ASR功能目前仅支持硅基流动平台' });
    }
    
    // 构建请求URL
    let apiUrl;
    if (accessUrl.includes('/audio/transcriptions')) {
      apiUrl = accessUrl;
    } else {
      apiUrl = `${accessUrl}/audio/transcriptions`;
    }
    
    // 添加日志
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('ASR转录请求详情:');
    console.log(`URL: '${apiUrl}'`);
    console.log(`KEY: ${maskedKey}`);
    console.log(`模型: ${modelName}`);
    console.log(`音频文件大小: ${audioFile.size} bytes`);
    
    // 将base64音频数据转换为Buffer
    const audioBuffer = Buffer.from(audioFile.data, 'base64');
    
    // 使用FormData构建multipart/form-data请求
    const FormData = require('form-data');
    const formData = new FormData();
    
    // 添加音频文件
    formData.append('file', audioBuffer, {
      filename: audioFile.name || 'audio.wav',
      contentType: audioFile.type || 'audio/wav'
    });
    
    // 添加模型名称
    formData.append('model', modelName);
    
    // 发送请求到硅基流动API
    const response = await axios({
      method: 'post',
      url: apiUrl,
      headers: {
        'Authorization': `Bearer ${accessKey}`,
        ...formData.getHeaders()
      },
      data: formData,
      timeout: 60000, // 60秒超时
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('ASR转录成功:', response.data);
    res.json(response.data);
    
  } catch (error) {
    console.error('ASR转录请求错误:', error);
    
    // 如果有来自目标API的响应，则转发该响应
    if (error.response) {
      try {
        const errorResponse = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
        
        return res.status(error.response.status).json(errorResponse);
      } catch (serializationError) {
        console.error('错误序列化失败:', serializationError);
        return res.status(500).json({ 
          error: 'ASR转录失败', 
          message: error.message,
          responseStatus: error.response ? error.response.status : undefined,
          responseStatusText: error.response ? error.response.statusText : undefined
        });
      }
    }
    
    res.status(500).json({ error: 'ASR转录失败', message: error.message });
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

// 代理视频生成API请求
router.post('/video/generation', authenticateToken, async (req, res) => {
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
      // SiliconFlow API使用/v1/video/submit端点
      if (accessUrl.includes('/video/submit')) {
        // 如果URL已经包含video/submit路径，直接使用
        requestUrl = accessUrl;
      } else {
        // 如果URL不包含video/submit路径，添加它
        requestUrl = accessUrl.endsWith('/') ? 
          accessUrl + 'video/submit' : 
          accessUrl + '/video/submit';
      }
    } else {
      // 其他API格式
      if (accessUrl.includes('/video/generation')) {
        requestUrl = accessUrl;
      } else {
        requestUrl = accessUrl + '/video/generation';
      }
    }
    
    // 添加日志
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('视频生成请求详情:');
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
    console.error('视频生成请求错误:', error);
    
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
          error: '视频生成失败', 
          message: error.message,
          responseStatus: error.response ? error.response.status : undefined,
          responseStatusText: error.response ? error.response.statusText : undefined
        });
      }
    }
    
    res.status(500).json({ error: '视频生成失败', message: error.message });
  }
});

// 代理TTS语音合成API请求
router.post('/tts/speech', authenticateToken, async (req, res) => {
  try {
    const { modelInfo, requestBody } = req.body;
    
    if (!modelInfo || !requestBody) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    let { accessUrl, accessKey, modelName } = modelInfo;
    
    // 清理URL，去除可能的空格和特殊字符
    if (accessUrl) {
      accessUrl = accessUrl.trim().replace(/[`'"\s()\[\]]/g, '');
      // 确保URL以正确的格式结尾
      if (accessUrl.endsWith('/')) {
        accessUrl = accessUrl.slice(0, -1);
      }
    }
    
    // 清理API Key，去除可能的空格、换行符等特殊字符
    if (accessKey) {
      accessKey = accessKey.trim().replace(/[\r\n\t\s]/g, '');
    }
    
    if (!accessUrl || !accessKey || !modelName) {
      return res.status(400).json({ error: '模型信息不完整' });
    }
    
    // URL格式验证
    try {
      new URL(accessUrl);
    } catch (urlError) {
      console.error('URL格式错误:', accessUrl, urlError.message);
      return res.status(400).json({ 
        error: 'API URL格式无效', 
        details: `URL: ${accessUrl}`,
        suggestion: '请检查API URL格式，确保是完整的HTTPS URL'
      });
    }
    
    // 检查是否为硅基流动平台
    if (!accessUrl.includes('siliconflow.cn')) {
      return res.status(400).json({ error: 'TTS功能目前仅支持硅基流动平台' });
    }
    
    // 构建请求URL
    let apiUrl;
    if (accessUrl.includes('/audio/speech')) {
      apiUrl = accessUrl;
    } else {
      apiUrl = `${accessUrl}/audio/speech`;
    }
    
    // 添加日志
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('TTS请求详情:');
    console.log(`URL: ${apiUrl}`);
    console.log(`KEY: ${maskedKey}`);
    console.log(`模型: ${modelName}`);
    console.log(`文本长度: ${requestBody.input ? requestBody.input.length : 0}`);
    
    // 发送请求到TTS API
    const response = await axios({
      method: 'post',
      url: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`
      },
      data: {
        ...requestBody,
        model: modelName
      },
      responseType: 'arraybuffer' // 接收音频数据
    });
    
    console.log('TTS API响应状态:', response.status);
    console.log('TTS响应头:', response.headers['content-type']);
    console.log('TTS音频大小:', response.data.length, 'bytes');
    
    // 设置响应头
    res.set({
      'Content-Type': response.headers['content-type'] || 'audio/mpeg',
      'Content-Length': response.data.length
    });
    
    // 返回音频数据
    res.send(response.data);
    
  } catch (error) {
    console.error('TTS代理请求错误:', error);
    
    if (error.response) {
      console.error('TTS API错误状态:', error.response.status);
      console.error('TTS API错误数据:', error.response.data);
      
      // 尝试解析错误响应
      let errorMessage = 'TTS API调用失败';
      if (error.response.data) {
        try {
          const errorData = Buffer.isBuffer(error.response.data) 
            ? JSON.parse(error.response.data.toString()) 
            : error.response.data;
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('解析TTS错误响应失败:', parseError);
        }
      }
      
      return res.status(error.response.status).json({
        error: errorMessage,
        status: error.response.status,
        statusText: error.response.statusText
      });
    }
    
    res.status(500).json({ 
      error: 'TTS代理请求失败', 
      message: error.message 
    });
  }
});

// 代理视频生成状态查询API请求
router.post('/video/status', authenticateToken, async (req, res) => {
  try {
    const { modelInfo, requestId } = req.body;
    
    if (!modelInfo || !requestId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    let { accessUrl, accessKey } = modelInfo;
    
    // 清理URL，去除可能的空格和特殊字符
    if (accessUrl) {
      accessUrl = accessUrl.trim().replace(/[`'"\s]/g, '');
    }
    
    if (!accessUrl || !accessKey) {
      return res.status(400).json({ error: '模型信息不完整' });
    }
    
    // 构建请求URL，支持不同的API端点格式
    let requestUrl;
    if (accessUrl.includes('siliconflow.cn')) {
      // SiliconFlow API使用/v1/video/status端点
      if (accessUrl.includes('/video/status')) {
        requestUrl = accessUrl;
      } else {
        // 替换submit为status
        requestUrl = accessUrl.replace('/video/submit', '/video/status');
        if (!requestUrl.includes('/video/status')) {
          requestUrl = accessUrl.endsWith('/') ? 
            accessUrl + 'video/status' : 
            accessUrl + '/video/status';
        }
      }
    } else {
      // 其他API格式
      requestUrl = accessUrl + '/video/status';
    }
    
    // 添加日志
    const maskedKey = accessKey.substring(0, 4) + '****' + accessKey.slice(-4);
    console.log('视频状态查询请求详情:');
    console.log(`URL: '${requestUrl}'`);
    console.log(`KEY: ${maskedKey}`);
    console.log(`请求ID: ${requestId}`);
    
    // 发送请求到目标API
    const response = await axios({
      method: 'post',
      url: requestUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`
      },
      data: {
        requestId: requestId
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('视频状态查询错误:', error);
    
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
          error: '状态查询失败', 
          message: error.message,
          responseStatus: error.response ? error.response.status : undefined,
          responseStatusText: error.response ? error.response.statusText : undefined
        });
      }
    }
    
    res.status(500).json({ error: '状态查询失败', message: error.message });
  }
});

module.exports = router;