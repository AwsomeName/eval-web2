const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// 测试配置
const config = {
  apiKey: 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot',
  apiUrl: 'https://api.siliconflow.cn/v1/audio/transcriptions',
  audioFile: '/home/lc/eval-web2/test_data/20250811_105907.wav',
  modelName: 'FunAudioLLM/SenseVoiceSmall'
};

async function testASRDirect() {
  console.log('=== 直接测试硅基流动ASR API ===');
  
  try {
    // 读取音频文件
    const audioBuffer = fs.readFileSync(config.audioFile);
    console.log(`音频文件大小: ${audioBuffer.length} bytes`);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'test_audio.wav',
      contentType: 'audio/wav'
    });
    formData.append('model', config.modelName);
    
    console.log('发送请求到:', config.apiUrl);
    console.log('使用模型:', config.modelName);
    console.log('API Key:', config.apiKey.substring(0, 4) + '****' + config.apiKey.slice(-4));
    
    const response = await axios({
      method: 'post',
      url: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        ...formData.getHeaders()
      },
      data: formData,
      timeout: 60000
    });
    
    console.log('\n=== 直接API调用成功 ===');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n=== 直接API调用失败 ===');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

async function testASRProxy() {
  console.log('\n=== 测试代理ASR接口 ===');
  
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
    
    console.log('发送请求到代理接口: http://localhost:3000/api/proxy/audio/transcriptions');
    console.log('模型信息:', {
      accessUrl: requestBody.modelInfo.accessUrl,
      accessKey: requestBody.modelInfo.accessKey.substring(0, 4) + '****' + requestBody.modelInfo.accessKey.slice(-4),
      modelName: requestBody.modelInfo.modelName
    });
    console.log('音频文件信息:', {
      name: requestBody.audioFile.name,
      type: requestBody.audioFile.type,
      size: requestBody.audioFile.size
    });
    
    const response = await axios({
      method: 'post',
      url: 'http://localhost:3001/api/proxy/audio/transcriptions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // 需要有效的JWT token
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
  }
}

async function main() {
  console.log('开始ASR接口调试测试...');
  console.log('时间:', new Date().toISOString());
  
  // 检查音频文件是否存在
  if (!fs.existsSync(config.audioFile)) {
    console.error('音频文件不存在:', config.audioFile);
    return;
  }
  
  // 先测试直接API调用
  await testASRDirect();
  
  // 等待一秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 再测试代理接口
  await testASRProxy();
  
  console.log('\n测试完成!');
}

// 运行测试
main().catch(console.error);