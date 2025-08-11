const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置信息
const config = {
  proxyUrl: 'http://localhost:3001/api/proxy/tts/speech',
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc1NDg5ODc4OSwiZXhwIjoxNzU0OTg1MTg5fQ.-5TqjMsYETEGUVp_gBPdO1q1-auDYtJTXb2M3lG3Gr0',
  modelInfo: {
    accessUrl: 'https://api.siliconflow.cn/v1/audio/speech',
    accessKey: 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot',
    modelName: 'fnlp/MOSS-TTSD-v0.5'
  },
  requestBody: {
    model: 'fnlp/MOSS-TTSD-v0.5',
    input: '你好，这是通过代理服务器的TTS测试。',
    voice: 'fnlp/MOSS-TTSD-v0.5:alex',
    response_format: 'mp3',
    speed: 1.0
  }
};

async function testTTSProxy() {
  console.log('=== 测试通过代理服务器的TTS功能 ===\n');
  
  console.log('配置信息:');
  console.log('代理URL:', config.proxyUrl);
  console.log('目标API:', config.modelInfo.accessUrl);
  console.log('模型:', config.modelInfo.modelName);
  console.log('文本:', config.requestBody.input);
  console.log('API Key:', config.modelInfo.accessKey.substring(0, 10) + '...');
  console.log();
  
  try {
    console.log('发送代理TTS请求...');
    
    const response = await axios({
      method: 'POST',
      url: config.proxyUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`
      },
      data: {
        modelInfo: config.modelInfo,
        requestBody: config.requestBody
      },
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    console.log('✅ 代理TTS请求成功!');
    console.log('状态码:', response.status);
    console.log('内容类型:', response.headers['content-type']);
    console.log('音频大小:', response.data.length, 'bytes');
    
    // 保存音频文件
    const outputPath = path.join(__dirname, 'tts-proxy-output.mp3');
    fs.writeFileSync(outputPath, response.data);
    console.log('音频文件已保存:', outputPath);
    
  } catch (error) {
    console.error('❌ 代理TTS请求失败:');
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('状态文本:', error.response.statusText);
      console.error('响应头:', error.response.headers);
      
      try {
        const errorData = error.response.data.toString();
        console.error('错误响应:', errorData);
      } catch (e) {
        console.error('无法解析错误响应');
      }
    } else if (error.request) {
      console.error('请求错误:', error.message);
      console.error('无响应收到');
    } else {
      console.error('配置错误:', error.message);
    }
  }
}

// 测试不同参数组合
async function testDifferentParams() {
  console.log('\n=== 测试不同参数组合 ===\n');
  
  const testCases = [
    {
      name: '基础测试',
      requestBody: {
        model: config.modelInfo.modelName,
        input: '你好世界',
        voice: 'fnlp/MOSS-TTSD-v0.5:alex'
      }
    },
    {
      name: '英文测试',
      requestBody: {
        model: config.modelInfo.modelName,
        input: 'Hello, this is a proxy test.',
        voice: 'fnlp/MOSS-TTSD-v0.5:alex',
        response_format: 'mp3',
        speed: 1.0
      }
    },
    {
      name: '长文本测试',
      requestBody: {
        model: config.modelInfo.modelName,
        input: '这是一个通过代理服务器进行的较长文本TTS测试，用来验证代理功能是否能够正确处理较长的输入文本。',
        voice: 'fnlp/MOSS-TTSD-v0.5:alex',
        response_format: 'mp3'
      }
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`测试 ${i + 1}: ${testCase.name}`);
    console.log('文本:', testCase.requestBody.input);
    
    try {
      const response = await axios({
        method: 'POST',
        url: config.proxyUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.authToken}`
        },
        data: {
          modelInfo: config.modelInfo,
          requestBody: testCase.requestBody
        },
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      console.log(`✅ 成功 - 音频大小: ${response.data.length} bytes`);
      
      // 保存音频文件
      const outputPath = path.join(__dirname, `tts-proxy-test-${i + 1}.mp3`);
      fs.writeFileSync(outputPath, response.data);
      console.log(`文件保存: tts-proxy-test-${i + 1}.mp3`);
      
    } catch (error) {
      console.error(`❌ 失败:`, error.response?.status || error.message);
      if (error.response?.data) {
        try {
          const errorData = error.response.data.toString();
          console.error('错误详情:', errorData);
        } catch (e) {
          console.error('无法解析错误响应');
        }
      }
    }
    
    console.log();
  }
}

async function main() {
  console.log('TTS代理功能调试测试开始\n');
  
  await testTTSProxy();
  await testDifferentParams();
  
  console.log('=== 测试完成 ===');
}

main().catch(console.error);