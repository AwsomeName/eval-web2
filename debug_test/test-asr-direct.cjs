const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// 测试配置
const config = {
  apiKey: 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot',
  apiUrl: 'https://api.siliconflow.cn/v1/audio/transcriptions',
  audioFile: '/home/lc/eval-web2/test_data/20250811_105907.wav',
  modelName: 'FunAudioLLM/SenseVoiceSmall'
};

async function testASRWithoutAuth() {
  console.log('=== 测试ASR接口（绕过认证） ===');
  
  try {
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
    
    // 模拟ASR接口的核心逻辑
    console.log('\n=== 模拟ASR接口处理逻辑 ===');
    
    const { modelInfo, audioFile } = requestBody;
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
    
    console.log('清理后的URL:', accessUrl);
    console.log('清理后的Key:', accessKey.substring(0, 4) + '****' + accessKey.slice(-4));
    
    // URL格式验证
    try {
      new URL(accessUrl);
      console.log('URL格式验证: 通过');
    } catch (urlError) {
      console.error('URL格式错误:', accessUrl, urlError.message);
      return;
    }
    
    // 检查是否为硅基流动平台
    if (!accessUrl.includes('siliconflow.cn')) {
      console.error('ASR功能目前仅支持硅基流动平台');
      return;
    }
    
    // 构建请求URL
    let apiUrl;
    if (accessUrl.includes('/audio/transcriptions')) {
      apiUrl = accessUrl;
    } else {
      apiUrl = `${accessUrl}/audio/transcriptions`;
    }
    
    console.log('最终API URL:', apiUrl);
    console.log('音频文件大小:', audioFile.size, 'bytes');
    
    // 将base64音频数据转换为Buffer
    const audioBufferFromBase64 = Buffer.from(audioFile.data, 'base64');
    console.log('从base64转换的Buffer大小:', audioBufferFromBase64.length, 'bytes');
    
    // 使用FormData构建multipart/form-data请求
    const formData = new FormData();
    
    // 添加音频文件
    formData.append('file', audioBufferFromBase64, {
      filename: audioFile.name || 'audio.wav',
      contentType: audioFile.type || 'audio/wav'
    });
    
    // 添加模型名称
    formData.append('model', modelName);
    
    console.log('FormData headers:', formData.getHeaders());
    
    // 发送请求到硅基流动API
    console.log('\n=== 发送请求到硅基流动API ===');
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
    
  } catch (error) {
    console.error('\n=== ASR转录失败 ===');
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

async function main() {
  console.log('开始ASR接口直接测试...');
  console.log('时间:', new Date().toISOString());
  
  // 检查音频文件是否存在
  if (!fs.existsSync(config.audioFile)) {
    console.error('音频文件不存在:', config.audioFile);
    return;
  }
  
  await testASRWithoutAuth();
  
  console.log('\n测试完成!');
}

// 运行测试
main().catch(console.error);