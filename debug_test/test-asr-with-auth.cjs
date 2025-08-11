const fs = require('fs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// 测试配置
const config = {
  apiKey: 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot',
  apiUrl: 'https://api.siliconflow.cn/v1/audio/transcriptions',
  audioFile: '/home/lc/eval-web2/test_data/20250811_105907.wav',
  modelName: 'FunAudioLLM/SenseVoiceSmall',
  backendUrl: 'http://localhost:3001'
};

// JWT配置（从auth.js中获取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function generateTestToken() {
  // 生成一个测试用的JWT token
  const payload = {
    userId: 1,
    username: 'test-user',
    role: 'admin'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function testASRProxyWithAuth() {
  console.log('=== 测试代理ASR接口（带认证） ===');
  
  try {
    // 生成测试token
    const token = generateTestToken();
    console.log('生成的测试token:', token.substring(0, 20) + '...');
    
    // 读取音频文件并转换为base64
    const audioBuffer = fs.readFileSync(config.audioFile);
    const audioBase64 = audioBuffer.toString('base64');
    
    console.log(`原始音频文件大小: ${audioBuffer.length} bytes`);
    console.log(`Base64编码后大小: ${audioBase64.length} characters`);
    
    const requestBody = {
      modelInfo: {
        accessUrl: config.apiUrl,
        accessKey: config.apiKey,
        modelName: config.modelName
      },
      audioFile: {
        name: '20250811_105907.wav',
        type: 'audio/wav',
        size: audioBuffer.length,
        data: audioBase64
      }
    };
    
    console.log('发送请求到代理接口:', `${config.backendUrl}/api/proxy/audio/transcriptions`);
    console.log('模型信息:', {
      accessUrl: requestBody.modelInfo.accessUrl,
      accessKey: requestBody.modelInfo.accessKey.substring(0, 4) + '****' + requestBody.modelInfo.accessKey.slice(-4),
      modelName: requestBody.modelInfo.modelName
    });
    console.log('音频文件信息:', {
      name: requestBody.audioFile.name,
      type: requestBody.audioFile.type,
      size: requestBody.audioFile.size,
      dataLength: requestBody.audioFile.data.length
    });
    
    const response = await axios({
      method: 'post',
      url: `${config.backendUrl}/api/proxy/audio/transcriptions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: requestBody,
      timeout: 60000
    });
    
    console.log('\n=== 代理接口调用成功 ===');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n=== 代理接口调用失败 ===');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    if (error.code) {
      console.error('错误代码:', error.code);
    }
  }
}

async function testASRProxyWithoutAuth() {
  console.log('\n=== 测试代理ASR接口（无认证） ===');
  
  try {
    // 读取音频文件并转换为base64
    const audioBuffer = fs.readFileSync(config.audioFile);
    const audioBase64 = audioBuffer.toString('base64');
    
    const requestBody = {
      modelInfo: {
        accessUrl: config.apiUrl,
        accessKey: config.apiKey,
        modelName: config.modelName
      },
      audioFile: {
        name: '20250811_105907.wav',
        type: 'audio/wav',
        size: audioBuffer.length,
        data: audioBase64
      }
    };
    
    console.log('发送请求到代理接口（无认证）:', `${config.backendUrl}/api/proxy/audio/transcriptions`);
    
    const response = await axios({
      method: 'post',
      url: `${config.backendUrl}/api/proxy/audio/transcriptions`,
      headers: {
        'Content-Type': 'application/json'
        // 不包含Authorization头
      },
      data: requestBody,
      timeout: 60000
    });
    
    console.log('\n=== 无认证代理接口调用成功 ===');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n=== 无认证代理接口调用失败 ===');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

async function main() {
  console.log('开始ASR代理接口测试...');
  console.log('时间:', new Date().toISOString());
  
  // 检查音频文件是否存在
  if (!fs.existsSync(config.audioFile)) {
    console.error('音频文件不存在:', config.audioFile);
    return;
  }
  
  // 先测试无认证（应该返回401）
  await testASRProxyWithoutAuth();
  
  // 等待一秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 再测试带认证
  await testASRProxyWithAuth();
  
  console.log('\n测试完成!');
}

// 运行测试
main().catch(console.error);