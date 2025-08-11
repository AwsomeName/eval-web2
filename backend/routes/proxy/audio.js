const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const { authenticateToken } = require('../../middleware/auth');
const { cleanUrl, cleanApiKey, maskApiKey, validateUrl, handleApiError } = require('./utils');

const router = express.Router();

// 代理ASR音频转录API请求
router.post('/transcriptions', authenticateToken, async (req, res) => {
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
      accessKey = cleanApiKey(accessKey);
    }
    
    if (!accessUrl || !accessKey || !modelName) {
      return res.status(400).json({ error: '模型信息不完整' });
    }
    
    // URL格式验证
    if (!validateUrl(accessUrl)) {
      console.error('URL格式错误:', accessUrl);
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
    const maskedKey = maskApiKey(accessKey);
    console.log('ASR转录请求详情:');
    console.log(`URL: '${apiUrl}'`);
    console.log(`KEY: ${maskedKey}`);
    console.log(`模型: ${modelName}`);
    console.log(`音频文件大小: ${audioFile.size} bytes`);
    
    // 将base64音频数据转换为Buffer
    const audioBuffer = Buffer.from(audioFile.data, 'base64');
    
    // 使用FormData构建multipart/form-data请求
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
    handleApiError(error, res, 'ASR转录');
  }
});

// 代理TTS语音合成API请求
router.post('/speech', authenticateToken, async (req, res) => {
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
      accessKey = cleanApiKey(accessKey);
    }
    
    if (!accessUrl || !accessKey || !modelName) {
      return res.status(400).json({ error: '模型信息不完整' });
    }
    
    // URL格式验证
    if (!validateUrl(accessUrl)) {
      console.error('URL格式错误:', accessUrl);
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
    const maskedKey = maskApiKey(accessKey);
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

module.exports = router;