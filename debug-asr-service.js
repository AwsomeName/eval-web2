import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模拟浏览器环境
class MockFile {
  constructor(buffer, name, type) {
    this.buffer = buffer;
    this.name = name;
    this.type = type;
    this.size = buffer.length;
  }
}

class MockFileReader {
  readAsDataURL(file) {
    setTimeout(() => {
      try {
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;
        this.result = dataUrl;
        if (this.onload) {
          this.onload({ target: { result: dataUrl } });
        }
      } catch (error) {
        if (this.onerror) {
          this.onerror(error);
        }
      }
    }, 10);
  }
}

// 模拟全局对象
global.FileReader = MockFileReader;
global.localStorage = {
  getItem: (key) => {
    if (key === 'token') return 'test-token-123';
    return null;
  }
};

// 模拟antd message
const mockMessage = {
  success: (msg) => console.log(`✅ SUCCESS: ${msg}`),
  error: (msg) => console.log(`❌ ERROR: ${msg}`),
  warning: (msg) => console.log(`⚠️  WARNING: ${msg}`),
  info: (msg) => console.log(`ℹ️  INFO: ${msg}`)
};

// 模拟fetch API
global.fetch = async (url, options) => {
  console.log(`\n🌐 模拟API请求:`);
  console.log(`URL: ${url}`);
  console.log(`Method: ${options.method}`);
  console.log(`Headers:`, options.headers);
  
  if (url === '/api/proxy/audio/transcriptions') {
    const body = JSON.parse(options.body);
    console.log(`模型信息:`, {
      accessUrl: body.modelInfo.accessUrl,
      modelName: body.modelInfo.modelName,
      audioFileSize: body.audioFile.size
    });
    
    // 模拟成功响应
    return {
      ok: true,
      status: 200,
      json: async () => ({
        text: "这是通过ASR服务转录的音频内容示例，用于调试测试。",
        language: "zh-CN",
        duration: 3.8,
        segments: [
          {
            start: 0.0,
            end: 3.8,
            text: "这是通过ASR服务转录的音频内容示例，用于调试测试。"
          }
        ]
      })
    };
  }
  
  throw new Error(`未知的API端点: ${url}`);
};

// 导入ASR服务（需要模拟antd）
const originalAntd = await import('antd').catch(() => null);
if (!originalAntd) {
  // 如果antd不存在，创建模拟模块
  const antdMock = { message: mockMessage };
  
  // 创建临时的antd模拟文件
  const mockAntdPath = path.join(__dirname, 'mock-antd.js');
  fs.writeFileSync(mockAntdPath, `export const message = ${JSON.stringify(mockMessage, null, 2).replace(/"([^"]+)":/g, '$1:').replace(/"([^"]+)"/g, "'$1'")};`);
  
  // 修改asrTestService.js以使用模拟的antd
  const asrServicePath = path.join(__dirname, 'src/services/asrTestService.js');
  const asrServiceContent = fs.readFileSync(asrServicePath, 'utf8');
  const modifiedContent = asrServiceContent.replace(
    "import { message } from 'antd';",
    `const mockMessage = {
  success: (msg) => console.log(\`✅ SUCCESS: \${msg}\`),
  error: (msg) => console.log(\`❌ ERROR: \${msg}\`),
  warning: (msg) => console.log(\`⚠️  WARNING: \${msg}\`),
  info: (msg) => console.log(\`ℹ️  INFO: \${msg}\`)
};
const message = mockMessage;`
  );
  
  const tempServicePath = path.join(__dirname, 'temp-asr-service.js');
  fs.writeFileSync(tempServicePath, modifiedContent);
  
  // 导入修改后的服务
  const { handleASRTest, validateAudioFile } = await import(`./temp-asr-service.js?t=${Date.now()}`);
  
  // 清理临时文件
  fs.unlinkSync(tempServicePath);
  fs.unlinkSync(mockAntdPath);
  
  await runASRDebugTest(handleASRTest, validateAudioFile);
} else {
  // 如果antd存在，直接导入
  const { handleASRTest, validateAudioFile } = await import('./src/services/asrTestService.js');
  await runASRDebugTest(handleASRTest, validateAudioFile);
}

async function runASRDebugTest(handleASRTest, validateAudioFile) {
  console.log('🚀 开始ASR服务调试测试\n');
  
  try {
    // 读取音频文件
    const audioFilePath = '/home/lc/eval-web2/test_data/20250811_105907.wav';
    console.log(`📁 读取音频文件: ${audioFilePath}`);
    
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`音频文件不存在: ${audioFilePath}`);
    }
    
    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioFile = new MockFile(audioBuffer, '20250811_105907.wav', 'audio/wav');
    
    console.log(`📊 音频文件信息:`);
    console.log(`  - 文件名: ${audioFile.name}`);
    console.log(`  - 文件类型: ${audioFile.type}`);
    console.log(`  - 文件大小: ${audioFile.size} bytes (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // 测试文件验证
    console.log('\n🔍 测试音频文件验证...');
    const isValid = validateAudioFile(audioFile);
    console.log(`验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`);
    
    if (!isValid) {
      console.log('❌ 音频文件验证失败，停止测试');
      return;
    }
    
    // 模拟模型信息
    const modelInfo = {
      accessUrl: 'https://api.siliconflow.cn/v1',
      accessKey: 'sk-test-key-for-debugging',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    };
    
    console.log('\n🔧 模型配置:');
    console.log(`  - API URL: ${modelInfo.accessUrl}`);
    console.log(`  - 模型名称: ${modelInfo.modelName}`);
    console.log(`  - API Key: ${modelInfo.accessKey.substring(0, 8)}****`);
    
    // 模拟回调函数
    let testOutput = '';
    let isStreaming = false;
    
    const setTestOutput = (output) => {
      if (typeof output === 'function') {
        testOutput = output(testOutput);
      } else {
        testOutput = output;
      }
      console.log(`\n📝 测试输出更新:\n${testOutput}`);
    };
    
    const setIsStreaming = (streaming) => {
      isStreaming = streaming;
      console.log(`\n🔄 流式状态: ${streaming ? '开始' : '结束'}`);
    };
    
    // 创建AbortController用于取消请求
    const abortController = new AbortController();
    
    console.log('\n🎯 开始ASR转录测试...');
    
    // 执行ASR测试
    const result = await handleASRTest(
      audioFile,
      modelInfo,
      setTestOutput,
      setIsStreaming,
      abortController.signal
    );
    
    console.log('\n🎉 ASR测试完成!');
    console.log(`转录结果: "${result}"`);
    console.log(`最终输出:\n${testOutput}`);
    
    // 测试错误处理
    console.log('\n🧪 测试错误处理...');
    
    // 测试不支持的平台
    const invalidModelInfo = {
      ...modelInfo,
      accessUrl: 'https://api.openai.com/v1'
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
      console.log(`✅ 正确捕获平台限制错误: ${error.message}`);
    }
    
    // 测试无效文件格式
    console.log('\n🧪 测试无效文件格式...');
    const invalidFile = new MockFile(Buffer.from('invalid'), 'test.txt', 'text/plain');
    const invalidResult = validateAudioFile(invalidFile);
    console.log(`无效文件验证结果: ${invalidResult ? '❌ 意外通过' : '✅ 正确拒绝'}`);
    
    // 测试文件过大
    console.log('\n🧪 测试文件大小限制...');
    const largeBuffer = Buffer.alloc(26 * 1024 * 1024); // 26MB
    const largeFile = new MockFile(largeBuffer, 'large.wav', 'audio/wav');
    const largeResult = validateAudioFile(largeFile);
    console.log(`大文件验证结果: ${largeResult ? '❌ 意外通过' : '✅ 正确拒绝'}`);
    
    console.log('\n✅ 所有调试测试完成!');
    
  } catch (error) {
    console.error('\n❌ 调试测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

// 导出调试函数供其他脚本使用
export { runASRDebugTest };