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

// 模拟全局对象
global.FileReader = MockFileReader;
global.localStorage = {
  getItem: (key) => {
    if (key === 'token') {
      return 'test-token'; // 模拟token
    }
    return null;
  }
};

// 模拟fetch
global.fetch = async (url, options) => {
  console.log('模拟API调用:', url);
  console.log('请求选项:', JSON.stringify(options, null, 2));
  
  // 模拟成功响应
  return {
    ok: true,
    status: 200,
    json: async () => ({
      text: '这是一个测试音频文件的转录结果',
      language: 'zh',
      duration: 5.2
    })
  };
};

// 模拟antd message
const mockMessage = {
  success: (msg) => console.log('✅ Success:', msg),
  error: (msg) => console.log('❌ Error:', msg),
  warning: (msg) => console.log('⚠️ Warning:', msg),
  info: (msg) => console.log('ℹ️ Info:', msg)
};

// 动态导入ASR服务（需要修改导入路径以支持ES模块）
async function testASRService() {
  try {
    console.log('🚀 开始测试ASR服务...');
    
    // 读取音频文件
    const audioPath = path.join(__dirname, 'test_data', '20250811_105907.wav');
    console.log('📁 读取音频文件:', audioPath);
    
    if (!fs.existsSync(audioPath)) {
      throw new Error(`音频文件不存在: ${audioPath}`);
    }
    
    const audioBuffer = fs.readFileSync(audioPath);
    console.log('📊 音频文件大小:', audioBuffer.length, 'bytes');
    
    // 创建模拟的File对象
    const audioFile = new MockFile(audioBuffer, '20250811_105907.wav', {
      type: 'audio/wav'
    });
    
    // 模拟模型信息
    const modelInfo = {
      accessUrl: 'https://api.siliconflow.cn/v1',
      accessKey: 'test-api-key',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    };
    
    // 模拟回调函数
    let testOutput = '';
    let isStreaming = false;
    
    const setTestOutput = (output) => {
      if (typeof output === 'function') {
        testOutput = output(testOutput);
      } else {
        testOutput = output;
      }
      console.log('📝 测试输出更新:', testOutput);
    };
    
    const setIsStreaming = (streaming) => {
      isStreaming = streaming;
      console.log('🔄 流式状态:', streaming ? '开始' : '结束');
    };
    
    // 创建AbortController
    const abortController = new AbortController();
    
    // 首先验证音频文件
    console.log('\n🔍 验证音频文件格式...');
    
    // 由于我们需要模拟浏览器环境，我们需要创建一个简化的验证函数
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
        mockMessage.error('不支持的音频格式');
        return false;
      }
      
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        mockMessage.error('音频文件过大');
        return false;
      }
      
      return true;
    };
    
    if (!validateAudioFile(audioFile)) {
      throw new Error('音频文件验证失败');
    }
    
    console.log('✅ 音频文件验证通过');
    
    // 模拟handleASRTest函数的核心逻辑
    console.log('\n🎯 开始ASR测试...');
    
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

        // 发送请求到后端代理
        const response = await fetch('/api/proxy/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            modelInfo: {
              accessUrl,
              accessKey,
              modelName
            },
            audioFile: {
              data: base64Data,
              name: audioFile.name,
              type: audioFile.type,
              size: audioFile.size
            }
          }),
          signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 解析响应
        const result = await response.json();
        
        setIsStreaming(false);
        
        // 格式化输出结果
        const transcriptionText = result.text || '';
        
        if (!transcriptionText) {
          setTestOutput('## ASR测试完成\n\n**结果:** 未检测到语音内容或转录结果为空');
          mockMessage.warning('转录结果为空');
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
        mockMessage.success('ASR转录完成');
        
        return transcriptionText;
        
      } catch (error) {
        if (error.name === 'AbortError') {
          setTestOutput(prev => prev + '\n\n**请求已手动停止**');
          mockMessage.info('请求已手动停止');
          throw error;
        }
        
        console.error('ASR测试失败:', error);
        setIsStreaming(false);
        
        setTestOutput(`## ASR测试错误\n\n**错误信息:** ${error.message}\n\n**可能原因:**\n- 网络连接问题\n- 音频文件格式不支持\n- API服务不可用\n- 请求超时\n- 文件过大`);
        mockMessage.error(`ASR测试失败: ${error.message}`);
        return '';
      }
    };
    
    // 执行ASR测试
    const result = await handleASRTest(
      audioFile,
      modelInfo,
      setTestOutput,
      setIsStreaming,
      abortController.signal
    );
    
    console.log('\n🎉 测试完成!');
    console.log('📋 最终结果:', result);
    console.log('📄 最终输出:', testOutput);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('📊 错误详情:', error);
  }
}

// 运行测试
testASRService();