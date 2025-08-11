const axios = require('axios');
const fs = require('fs');
const path = require('path');

// TTS测试配置
const TTS_CONFIG = {
  modelInfo: {
    accessUrl: 'https://api.siliconflow.cn/v1/audio/speech',
    accessKey: 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot',
    modelName: 'fnlp/MOSS-TTSD-v0.5'
  },
  requestBody: {
    input: '你好，这是一个TTS测试。Hello, this is a TTS test.',
    voice: 'alloy', // 可选的语音类型
    response_format: 'mp3', // 音频格式
    speed: 1.0 // 语速
  }
};

// 后端服务器配置
const BACKEND_URL = 'http://localhost:3001';
const AUTH_TOKEN = 'your-auth-token'; // 需要替换为实际的认证token

async function testTTSProxy() {
  console.log('开始TTS代理测试...');
  console.log('配置信息:');
  console.log(`- API URL: ${TTS_CONFIG.modelInfo.accessUrl}`);
  console.log(`- 模型: ${TTS_CONFIG.modelInfo.modelName}`);
  console.log(`- 文本: ${TTS_CONFIG.requestBody.input}`);
  console.log('\n');

  try {
    // 发送TTS请求到代理服务器
    const response = await axios({
      method: 'post',
      url: `${BACKEND_URL}/api/proxy/tts/speech`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      data: TTS_CONFIG,
      responseType: 'arraybuffer', // 接收音频数据
      timeout: 30000 // 30秒超时
    });

    console.log('✅ TTS代理请求成功!');
    console.log(`响应状态: ${response.status}`);
    console.log(`内容类型: ${response.headers['content-type']}`);
    console.log(`音频大小: ${response.data.length} bytes`);

    // 保存音频文件
    const outputPath = path.join(__dirname, 'tts-output.mp3');
    fs.writeFileSync(outputPath, response.data);
    console.log(`音频文件已保存到: ${outputPath}`);

    return true;
  } catch (error) {
    console.error('❌ TTS代理请求失败:');
    
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`状态文本: ${error.response.statusText}`);
      
      // 尝试解析错误响应
      try {
        const errorData = Buffer.isBuffer(error.response.data) 
          ? JSON.parse(error.response.data.toString()) 
          : error.response.data;
        console.error('错误详情:', errorData);
      } catch (parseError) {
        console.error('原始错误数据:', error.response.data.toString());
      }
    } else if (error.request) {
      console.error('请求错误:', error.message);
      console.error('无法连接到后端服务器，请确保服务器正在运行');
    } else {
      console.error('配置错误:', error.message);
    }
    
    return false;
  }
}

async function testDirectTTSAPI() {
  console.log('\n开始直接TTS API测试...');
  
  try {
    // 直接调用硅基流动TTS API
    const response = await axios({
      method: 'post',
      url: TTS_CONFIG.modelInfo.accessUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TTS_CONFIG.modelInfo.accessKey}`
      },
      data: {
        ...TTS_CONFIG.requestBody,
        model: TTS_CONFIG.modelInfo.modelName
      },
      responseType: 'arraybuffer',
      timeout: 30000
    });

    console.log('✅ 直接TTS API调用成功!');
    console.log(`响应状态: ${response.status}`);
    console.log(`内容类型: ${response.headers['content-type']}`);
    console.log(`音频大小: ${response.data.length} bytes`);

    // 保存音频文件
    const outputPath = path.join(__dirname, 'tts-direct-output.mp3');
    fs.writeFileSync(outputPath, response.data);
    console.log(`音频文件已保存到: ${outputPath}`);

    return true;
  } catch (error) {
    console.error('❌ 直接TTS API调用失败:');
    
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`状态文本: ${error.response.statusText}`);
      
      try {
        const errorData = Buffer.isBuffer(error.response.data) 
          ? JSON.parse(error.response.data.toString()) 
          : error.response.data;
        console.error('API错误详情:', errorData);
      } catch (parseError) {
        console.error('原始API错误数据:', error.response.data.toString());
      }
    } else {
      console.error('网络错误:', error.message);
    }
    
    return false;
  }
}

async function main() {
  console.log('=== TTS功能调试测试 ===\n');
  
  // 首先测试直接API调用
  const directSuccess = await testDirectTTSAPI();
  
  if (directSuccess) {
    console.log('\n直接API调用成功，现在测试代理功能...');
    // 如果直接调用成功，再测试代理
    await testTTSProxy();
  } else {
    console.log('\n直接API调用失败，请检查API配置');
  }
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testTTSProxy,
  testDirectTTSAPI,
  TTS_CONFIG
};