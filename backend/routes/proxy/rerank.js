const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../../middleware/auth');
const { cleanUrl, maskApiKey } = require('./utils');

const router = express.Router();

// 代理Rerank重排序API请求
router.post('/', authenticateToken, async (req, res) => {
  try {
    let { accessUrl, accessKey, requestBody } = req.body;
    
    // 清理URL，去除可能的空格和特殊字符
    if (accessUrl) {
      accessUrl = cleanUrl(accessUrl);
    }
    
    if (!accessUrl || !accessKey || !requestBody) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 验证必要的请求参数
    if (!requestBody.model || !requestBody.query || !requestBody.documents) {
      return res.status(400).json({ 
        error: '缺少必要的rerank参数',
        required: ['model', 'query', 'documents']
      });
    }
    
    // 添加日志，记录实际请求的URL和KEY（部分隐藏）
    const maskedKey = maskApiKey(accessKey);
    console.log('Rerank API请求详情:');
    console.log(`URL: '${accessUrl}'`);
    console.log(`KEY: ${maskedKey}`);
    console.log(`模型: ${requestBody.model}`);
    console.log(`查询: ${requestBody.query}`);
    console.log(`文档数量: ${requestBody.documents.length}`);
    
    // 发送请求到目标API
    const response = await axios({
      method: 'post',
      url: accessUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`
      },
      data: requestBody,
      timeout: 30000
    });
    
    console.log('Rerank API响应状态:', response.status);
    console.log('Rerank API响应数据:', JSON.stringify(response.data).substring(0, 200) + '...');
    
    res.json(response.data);
    
  } catch (error) {
    console.log('❌ Rerank API请求失败:', error.message);
    
    if (error.response) {
      console.log('📊 错误状态:', error.response.status, error.response.statusText);
      console.log('📋 错误响应:', error.response.data);
      
      return res.status(error.response.status).json({
        error: 'Rerank代理请求失败',
        message: error.message,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    res.status(500).json({ 
      error: 'Rerank代理请求失败', 
      message: error.message 
    });
  }
});

module.exports = router;