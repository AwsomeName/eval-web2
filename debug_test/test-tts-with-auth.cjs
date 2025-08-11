const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// 配置
const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  username: 'testuser',
  password: 'testpass123'
};

// TTS测试配置
const TTS_CONFIG = {
  modelInfo: {
    accessUrl: 'https://api.siliconflow.cn/v1/audio/speech',
    accessKey: 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot', // 请替换为实际的API Key
    modelName: 'tts-1' // 硅基流动的TTS模型名称
  },
  requestBody: {
    input: '你好，这是一个TTS语音合成测试。今天天气很好，适合出去走走。',
    voice: 'alloy',
    response_format: 'mp3',
    speed: 1.0
  }
};

/**
 * 生成测试用的JWT token
 */
function generateTestToken() {
  const payload = {
    userId: 1,
    username: TEST_USER.username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1小时后过期
  };
  
  // 使用简单的密钥，实际应用中应该使用环境变量
  const secret = 'your-secret-key';
  return jwt.sign(payload, secret);
}

/**
 * 测试TTS代理接口（无认证）
 */
async function testTTSWithoutAuth() {
  console.log('\n🔒 测试TTS代理接口（无认证）...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/proxy/tts/speech`, TTS_CONFIG, {
      timeout: 30000
    });
    
    console.log('❌ 无认证请求应该失败，但却成功了');
    console.log('响应状态:', response.status);
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ 无认证请求正确被拒绝');
      console.log('状态码:', error.response.status);
      console.log('错误信息:', error.response.data.error || error.response.data.message);
    } else {
      console.log('❌ 意外的错误:', error.message);
      if (error.response) {
        console.log('状态码:', error.response.status);
        console.log('响应数据:', error.response.data);
      }
    }
  }
}

/**
 * 测试TTS代理接口（带认证）
 */
async function testTTSWithAuth() {
  console.log('\n🔑 测试TTS代理接口（带认证）...');
  
  try {
    const token = generateTestToken();
    console.log('生成的测试token:', token.substring(0, 20) + '...');
    
    console.log('\n📝 请求配置:');
    console.log('URL:', `${BASE_URL}/api/proxy/tts/speech`);
    console.log('模型:', TTS_CONFIG.modelInfo.modelName);
    console.log('文本:', TTS_CONFIG.requestBody.input);
    console.log('声音:', TTS_CONFIG.requestBody.voice);
    console.log('格式:', TTS_CONFIG.requestBody.response_format);
    
    const response = await axios.post(`${BASE_URL}/api/proxy/tts/speech`, TTS_CONFIG, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer', // 接收音频数据
      timeout: 60000 // 60秒超时
    });
    
    console.log('\n✅ TTS代理请求成功!');
    console.log('状态码:', response.status);
    console.log('内容类型:', response.headers['content-type']);
    console.log('音频大小:', response.data.length, 'bytes');
    console.log('音频大小:', (response.data.length / 1024).toFixed(2), 'KB');
    
    // 保存音频文件
    const outputPath = path.join(__dirname, 'tts-test-output.mp3');
    fs.writeFileSync(outputPath, response.data);
    console.log('\n💾 音频文件已保存到:', outputPath);
    
    // 验证文件大小
    const stats = fs.statSync(outputPath);
    console.log('文件大小验证:', stats.size, 'bytes');
    
    if (stats.size > 0) {
      console.log('✅ 音频文件生成成功，大小正常');
    } else {
      console.log('❌ 音频文件为空');
    }
    
  } catch (error) {
    console.log('❌ TTS代理请求失败:', error.message);
    
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('状态文本:', error.response.statusText);
      
      // 尝试解析错误响应
      if (error.response.data) {
        try {
          const errorData = Buffer.isBuffer(error.response.data) 
            ? JSON.parse(error.response.data.toString()) 
            : error.response.data;
          console.log('错误详情:', errorData);
        } catch (parseError) {
          console.log('原始错误数据:', error.response.data.toString().substring(0, 200));
        }
      }
    } else if (error.code) {
      console.log('错误代码:', error.code);
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 提示: 请确保后端服务器正在运行 (npm start)');
      }
    }
  }
}

/**
 * 测试不同的TTS参数
 */
async function testTTSVariations() {
  console.log('\n🎭 测试不同的TTS参数...');
  
  const variations = [
    {
      name: '短文本测试',
      input: '你好世界',
      voice: 'alloy'
    },
    {
      name: '英文文本测试',
      input: 'Hello, this is a test of English text-to-speech synthesis.',
      voice: 'echo'
    },
    {
      name: '长文本测试',
      input: '这是一个较长的文本测试，用来验证TTS系统对于长文本的处理能力。我们希望系统能够正确地将这段文字转换为自然流畅的语音。',
      voice: 'fable'
    }
  ];
  
  const token = generateTestToken();
  
  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    console.log(`\n📝 ${variation.name}:`);
    console.log('文本:', variation.input);
    console.log('声音:', variation.voice);
    
    try {
      const config = {
        modelInfo: TTS_CONFIG.modelInfo,
        requestBody: {
          ...TTS_CONFIG.requestBody,
          input: variation.input,
          voice: variation.voice
        }
      };
      
      const response = await axios.post(`${BASE_URL}/api/proxy/tts/speech`, config, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 60000
      });
      
      console.log('✅ 成功 - 音频大小:', (response.data.length / 1024).toFixed(2), 'KB');
      
      // 保存变体音频文件
      const filename = `tts-test-${i + 1}-${variation.voice}.mp3`;
      const outputPath = path.join(__dirname, filename);
      fs.writeFileSync(outputPath, response.data);
      console.log('💾 保存到:', filename);
      
    } catch (error) {
      console.log('❌ 失败:', error.response ? error.response.status : error.message);
    }
    
    // 添加延迟避免请求过于频繁
    if (i < variations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * 主测试函数
 */
async function runTTSTests() {
  console.log('🎵 开始TTS语音合成代理接口测试');
  console.log('=' .repeat(50));
  
  try {
    // 测试无认证访问
    await testTTSWithoutAuth();
    
    // 测试带认证访问
    await testTTSWithAuth();
    
    // 测试不同参数
    await testTTSVariations();
    
    console.log('\n🎉 TTS测试完成!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTTSTests().catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = {
  runTTSTests,
  testTTSWithAuth,
  testTTSWithoutAuth,
  testTTSVariations
};