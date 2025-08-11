const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 简化的TTS测试，直接调用硅基流动API
async function testTTSDirectly() {
  console.log('=== 直接测试硅基流动TTS API ===\n');
  
  const config = {
    url: 'https://api.siliconflow.cn/v1/audio/speech',
    apiKey: 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot',
    model: 'fnlp/MOSS-TTSD-v0.5',
    text: '你好，这是一个TTS测试。'
  };
  
  console.log('配置信息:');
  console.log(`URL: ${config.url}`);
  console.log(`模型: ${config.model}`);
  console.log(`文本: ${config.text}`);
  console.log(`API Key: ${config.apiKey.substring(0, 8)}...`);
  console.log();
  
  try {
    console.log('发送TTS请求...');
    
    const response = await axios({
      method: 'POST',
      url: config.url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      data: {
        model: config.model,
        input: config.text,
        voice: 'fnlp/MOSS-TTSD-v0.5:alex',
        response_format: 'mp3',
        speed: 1.0
      },
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    console.log('✅ TTS请求成功!');
    console.log(`状态码: ${response.status}`);
    console.log(`内容类型: ${response.headers['content-type']}`);
    console.log(`音频大小: ${response.data.length} bytes`);
    
    // 保存音频文件
    const outputPath = path.join(__dirname, 'tts-test-output.mp3');
    fs.writeFileSync(outputPath, response.data);
    console.log(`音频文件已保存: ${outputPath}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ TTS请求失败:');
    
    if (error.response) {
      console.error(`HTTP状态: ${error.response.status} ${error.response.statusText}`);
      console.error('响应头:', error.response.headers);
      
      // 尝试解析错误响应
      try {
        let errorData;
        if (Buffer.isBuffer(error.response.data)) {
          errorData = error.response.data.toString('utf8');
        } else {
          errorData = error.response.data;
        }
        
        console.error('错误响应:', errorData);
        
        // 尝试解析为JSON
        try {
          const jsonError = JSON.parse(errorData);
          console.error('解析后的错误:', jsonError);
        } catch (jsonParseError) {
          console.error('无法解析为JSON，原始错误:', errorData);
        }
      } catch (parseError) {
        console.error('解析错误响应失败:', parseError.message);
      }
    } else if (error.request) {
      console.error('网络请求错误:', error.message);
      console.error('请求配置:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      });
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    return false;
  }
}

// 测试不同的参数组合
async function testDifferentParams() {
  console.log('\n=== 测试不同参数组合 ===\n');
  
  const baseConfig = {
    url: 'https://api.siliconflow.cn/v1/audio/speech',
    apiKey: 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot',
    model: 'fnlp/MOSS-TTSD-v0.5'
  };
  
  const testCases = [
    {
      name: '基础测试',
      data: {
        model: baseConfig.model,
        input: '你好世界',
        voice: 'fnlp/MOSS-TTSD-v0.5:alex'
      }
    },
    {
      name: '指定格式和语速',
      data: {
        model: baseConfig.model,
        input: 'Hello, this is a test.',
        voice: 'fnlp/MOSS-TTSD-v0.5:alex',
        response_format: 'mp3',
        speed: 1.0
      }
    },
    {
      name: '长文本测试',
      data: {
        model: baseConfig.model,
        input: '这是一个较长的文本测试，用来验证TTS系统是否能够正确处理较长的输入文本。',
        voice: 'fnlp/MOSS-TTSD-v0.5:alex',
        response_format: 'mp3'
      }
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n测试 ${i + 1}: ${testCase.name}`);
    console.log(`文本: ${testCase.data.input}`);
    
    try {
      const response = await axios({
        method: 'POST',
        url: baseConfig.url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${baseConfig.apiKey}`
        },
        data: testCase.data,
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      console.log(`✅ 成功 - 音频大小: ${response.data.length} bytes`);
      
      // 保存文件
      const filename = `tts-test-${i + 1}.mp3`;
      const outputPath = path.join(__dirname, filename);
      fs.writeFileSync(outputPath, response.data);
      console.log(`文件保存: ${filename}`);
      
    } catch (error) {
      console.error(`❌ 失败: ${error.message}`);
      if (error.response) {
        console.error(`状态: ${error.response.status}`);
      }
    }
  }
}

async function main() {
  console.log('TTS API 调试测试开始\n');
  
  // 基础测试
  const success = await testTTSDirectly();
  
  if (success) {
    // 如果基础测试成功，进行更多测试
    await testDifferentParams();
  }
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testTTSDirectly, testDifferentParams };