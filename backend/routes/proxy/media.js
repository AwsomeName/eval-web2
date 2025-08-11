const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../../middleware/auth');
const { cleanUrl, maskApiKey, handleApiError } = require('./utils');

const router = express.Router();

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
      accessUrl = cleanUrl(accessUrl);
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
    const maskedKey = maskApiKey(accessKey);
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
    handleApiError(error, res, '图像生成');
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
      accessUrl = cleanUrl(accessUrl);
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
    const maskedKey = maskApiKey(accessKey);
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
    handleApiError(error, res, '视频生成');
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
      accessUrl = cleanUrl(accessUrl);
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
    const maskedKey = maskApiKey(accessKey);
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
    handleApiError(error, res, '视频状态查询');
  }
});

module.exports = router;