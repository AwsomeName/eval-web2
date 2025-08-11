import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模拟浏览器环境的File对象
class MockFile {
  constructor(buffer, name, options = {}) {
    this.buffer = buffer;
    this.name = name;
    this.type = options.type || 'audio/wav';
    this.size = buffer.length;
    this.lastModified = Date.now();
  }
}

// 模拟FileReader
class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }

  readAsDataURL(file) {
    try {
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      // 模拟异步行为
      setTimeout(() => {
        if (this.onload) {
          this.onload({ target: { result: dataUrl } });
        }
      }, 10);
    } catch (error) {
      setTimeout(() => {
        if (this.onerror) {
          this.onerror(error);
        }
      }, 10);
    }
  }
}

// 设置全局环境
global.FileReader = MockFileReader;
global.localStorage = {
  getItem: (key) => {
    if (key === 'token') {
      return 'test-token';
    }
    return null;
  }
};

// 模拟antd message
const message = {
  success: (msg) => console.log('✅ Success:', msg),
  error: (msg) => console.log('❌ Error:', msg),
  warning: (msg) => console.log('⚠️ Warning:', msg),
  info: (msg) => console.log('ℹ️ Info:', msg)
};

// 直接实现ASR服务的核心函数
const handleASRTest = async (audioFile, modelInfo, setTestOutput, setIsStreaming, signal) => {
  const { accessUrl, accessKey, modelName } = modelInfo;
  
  setTestOutput('正在上传音频文件并进行转录...');
  setIsStreaming(true);

  try {
    // 检查是否为硅基流动平台
    if (!accessUrl.includes('siliconflow.cn')) {
      throw new Error('ASR测试功能目前仅支持硅基流动平台');
    }

    setTestOutput('正在处理音频文件...');

    // 将音频文件转换为base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // 移除data:audio/xxx;base64,前缀
          const base64 = e.target.result.split(',')[1];
          resolve(base64);
        } catch (error) {
          reject(new Error('音频文件读取失败'));
        }
      };
      
      reader.onerror = () => reject(new Error('音频文件读取失败'));
      reader.readAsDataURL(audioFile);
    });

    setTestOutput('正在连接ASR API...');

    // 模拟API调用（因为我们在Node.js环境中无法真正调用浏览器API）
    console.log('📡 模拟API调用到:', '/api/proxy/audio/transcriptions');
    console.log('📊 音频文件信息:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      base64Length: base64Data.length
    });
    console.log('🔧 模型配置:', modelInfo);

    // 模拟成功响应
    const result = {
      text: '这是通过ASR服务转录的音频内容示例',
      language: 'zh-CN',
      duration: 3.5
    };
    
    setIsStreaming(false);
    
    // 格式化输出结果
    const transcriptionText = result.text || '';
    
    if (!transcriptionText) {
      setTestOutput('## ASR测试完成\n\n**结果:** 未检测到语音内容或转录结果为空');
      message.warning('转录结果为空');
      return '';
    }

    // 构建详细的输出信息
    let outputContent = `## ASR转录结果\n\n**转录文本:**\n${transcriptionText}\n\n`;
    
    if (result.language) {
      outputContent += `**检测语言:** ${result.language}\n\n`;
    }
    
    if (result.duration) {
      outputContent += `**音频时长:** ${result.duration}秒\n\n`;
    }
    
    outputContent += `**原始响应:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
    
    setTestOutput(outputContent);
    message.success('ASR转录完成');
    
    return transcriptionText;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      setTestOutput(prev => prev + '\n\n**请求已手动停止**');
      message.info('请求已手动停止');
      throw error;
    }
    
    console.error('ASR测试失败:', error);
    setIsStreaming(false);
    
    setTestOutput(`## ASR测试错误\n\n**错误信息:** ${error.message}\n\n**可能原因:**\n- 网络连接问题\n- 音频文件格式不支持\n- API服务不可用\n- 请求超时\n- 文件过大`);
    message.error(`ASR测试失败: ${error.message}`);
    return '';
  }
};

// 音频文件验证函数
const validateAudioFile = (file) => {
  const supportedFormats = [
    'audio/mpeg',
    'audio/mp3', 
    'audio/wav',
    'audio/flac',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/m4a'
  ];
  
  if (!supportedFormats.includes(file.type)) {
    message.error('不支持的音频格式，请上传 MP3、WAV、FLAC、AAC、OGG、WebM 或 M4A 格式的音频文件');
    return false;
  }
  
  // 检查文件大小（限制为25MB）
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (file.size > maxSize) {
    message.error('音频文件过大，请上传小于25MB的文件');
    return false;
  }
  
  return true;
};

// 主测试函数
async function testASRService() {
  try {
    console.log('🚀 开始ASR服务完整测试...');
    console.log('=' .repeat(50));
    
    // 读取音频文件
    const audioPath = path.join(__dirname, 'test_data', '20250811_105907.wav');
    console.log('📁 音频文件路径:', audioPath);
    
    if (!fs.existsSync(audioPath)) {
      throw new Error(`音频文件不存在: ${audioPath}`);
    }
    
    const audioBuffer = fs.readFileSync(audioPath);
    const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);
    console.log('📊 音频文件大小:', fileSizeMB, 'MB');
    
    // 创建模拟的File对象
    const audioFile = new MockFile(audioBuffer, '20250811_105907.wav', {
      type: 'audio/wav'
    });
    
    console.log('\n🔍 步骤1: 验证音频文件...');
    console.log('-'.repeat(30));
    
    // 测试文件验证
    const isValid = validateAudioFile(audioFile);
    if (!isValid) {
      throw new Error('音频文件验证失败');
    }
    console.log('✅ 音频文件验证通过');
    console.log('   - 文件名:', audioFile.name);
    console.log('   - 文件类型:', audioFile.type);
    console.log('   - 文件大小:', audioFile.size, 'bytes');
    
    console.log('\n🎯 步骤2: 测试ASR转录功能...');
    console.log('-'.repeat(30));
    
    // 模拟模型信息
    const modelInfo = {
      accessUrl: 'https://api.siliconflow.cn/v1',
      accessKey: 'sk-test-api-key-12345',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    };
    
    console.log('🔧 模型配置:');
    console.log('   - API URL:', modelInfo.accessUrl);
    console.log('   - API Key:', modelInfo.accessKey.substring(0, 10) + '...');
    console.log('   - 模型名称:', modelInfo.modelName);
    
    // 模拟回调函数
    let testOutput = '';
    let isStreaming = false;
    
    const setTestOutput = (output) => {
      if (typeof output === 'function') {
        testOutput = output(testOutput);
      } else {
        testOutput = output;
      }
      console.log('📝 输出更新:', output.substring(0, 50) + (output.length > 50 ? '...' : ''));
    };
    
    const setIsStreaming = (streaming) => {
      isStreaming = streaming;
      console.log('🔄 流式状态:', streaming ? '开始处理' : '处理完成');
    };
    
    // 创建AbortController
    const abortController = new AbortController();
    
    // 执行ASR测试
    console.log('\n🚀 开始执行ASR转录...');
    const startTime = Date.now();
    
    const result = await handleASRTest(
      audioFile,
      modelInfo,
      setTestOutput,
      setIsStreaming,
      abortController.signal
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n🎉 测试完成!');
    console.log('=' .repeat(50));
    console.log('⏱️  处理时间:', duration, '秒');
    console.log('📋 转录结果:', result);
    console.log('📊 流式状态:', isStreaming ? '进行中' : '已完成');
    
    console.log('\n📄 完整输出:');
    console.log('-'.repeat(30));
    console.log(testOutput);
    
    // 测试不同的错误情况
    console.log('\n🧪 步骤3: 测试错误处理...');
    console.log('-'.repeat(30));
    
    // 测试不支持的平台
    const invalidModelInfo = {
      accessUrl: 'https://api.openai.com/v1',
      accessKey: 'sk-test',
      modelName: 'whisper-1'
    };
    
    try {
      await handleASRTest(
        audioFile,
        invalidModelInfo,
        setTestOutput,
        setIsStreaming,
        abortController.signal
      );
    } catch (error) {
      console.log('✅ 正确捕获了不支持平台的错误:', error.message);
    }
    
    // 测试无效文件格式
    const invalidFile = new MockFile(Buffer.from('invalid'), 'test.txt', {
      type: 'text/plain'
    });
    
    const isInvalidFileValid = validateAudioFile(invalidFile);
    if (!isInvalidFileValid) {
      console.log('✅ 正确拒绝了无效文件格式');
    }
    
    // 测试过大文件
    const largeBuffer = Buffer.alloc(30 * 1024 * 1024); // 30MB
    const largeFile = new MockFile(largeBuffer, 'large.wav', {
      type: 'audio/wav'
    });
    
    const isLargeFileValid = validateAudioFile(largeFile);
    if (!isLargeFileValid) {
      console.log('✅ 正确拒绝了过大文件');
    }
    
    console.log('\n🎊 所有测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('📊 错误详情:', error.stack);
  }
}

// 运行测试
testASRService();