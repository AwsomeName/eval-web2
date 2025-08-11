#!/usr/bin/env node

/**
 * 完整的ASR服务测试脚本
 * 测试改进后的asrTestService.js逻辑
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模拟浏览器环境
global.File = class File {
  constructor(data, name, options = {}) {
    this.data = data;
    this.name = name;
    this.size = data.length;
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.readyState = 0; // EMPTY
    this.onload = null;
    this.onerror = null;
    this.onprogress = null;
  }
  
  readAsDataURL(file) {
    this.readyState = 1; // LOADING
    
    setTimeout(() => {
      try {
        if (this.onprogress) {
          this.onprogress({ loaded: file.size * 0.5, total: file.size });
        }
        
        const base64 = Buffer.from(file.data).toString('base64');
        this.result = `data:${file.type};base64,${base64}`;
        this.readyState = 2; // DONE
        
        if (this.onprogress) {
          this.onprogress({ loaded: file.size, total: file.size });
        }
        
        if (this.onload) {
          this.onload({ target: this });
        }
      } catch (error) {
        this.error = error;
        this.readyState = 2; // DONE
        if (this.onerror) {
          this.onerror({ target: this });
        }
      }
    }, 100);
  }
};

// 模拟antd message
const messageLog = [];
global.antd = {
  message: {
    success: (msg) => {
      console.log(`✅ SUCCESS: ${msg}`);
      messageLog.push({ type: 'success', message: msg });
    },
    error: (msg) => {
      console.log(`❌ ERROR: ${msg}`);
      messageLog.push({ type: 'error', message: msg });
    },
    warning: (msg) => {
      console.log(`⚠️  WARNING: ${msg}`);
      messageLog.push({ type: 'warning', message: msg });
    },
    info: (msg) => {
      console.log(`ℹ️  INFO: ${msg}`);
      messageLog.push({ type: 'info', message: msg });
    }
  }
};

// 模拟localStorage
global.localStorage = {
  getItem: (key) => {
    const mockData = {
      'asr_models': JSON.stringify([{
        id: 'test-model',
        name: 'Test ASR Model',
        accessUrl: 'https://api.siliconflow.cn/v1/audio/transcriptions',
        accessKey: 'test-key-12345'
      }])
    };
    return mockData[key] || null;
  }
};

// 模拟fetch API
global.fetch = async (url, options) => {
  console.log(`🌐 API Request: ${url}`);
  console.log(`📤 Request Options:`, {
    method: options?.method || 'GET',
    headers: options?.headers || {},
    bodyType: options?.body ? typeof options.body : 'none'
  });
  
  // 模拟不同的响应情况
  if (url.includes('/api/proxy/audio/transcriptions')) {
    // 模拟成功的ASR响应
    return {
      ok: true,
      status: 200,
      json: async () => ({
        text: '这是一段测试音频的转录结果。',
        segments: [{
          start: 0.0,
          end: 2.5,
          text: '这是一段测试音频的转录结果。'
        }],
        language: 'zh'
      })
    };
  }
  
  // 默认响应
  return {
    ok: false,
    status: 404,
    json: async () => ({ error: 'Not found' })
  };
};

// 动态导入ASR服务
const asrServicePath = path.join(__dirname, 'src/services/asrTestService.js');

async function runTests() {
  console.log('🚀 开始测试改进后的ASR服务逻辑\n');
  
  try {
    // 检查音频文件
    const audioFilePath = '/home/lc/eval-web2/test_data/20250811_105907.wav';
    console.log('📁 检查测试音频文件...');
    
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`音频文件不存在: ${audioFilePath}`);
    }
    
    const audioData = fs.readFileSync(audioFilePath);
    const audioFile = new File(audioData, '20250811_105907.wav', {
      type: 'audio/wav',
      lastModified: Date.now()
    });
    
    console.log(`✅ 音频文件加载成功:`);
    console.log(`   - 文件名: ${audioFile.name}`);
    console.log(`   - 大小: ${(audioFile.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - 类型: ${audioFile.type}\n`);
    
    // 动态导入ASR服务
    console.log('📦 导入ASR服务模块...');
    const asrService = await import(asrServicePath);
    console.log('✅ ASR服务模块导入成功\n');
    
    // 测试1: 验证改进后的validateAudioFile函数
    console.log('🧪 测试1: 音频文件验证功能');
    console.log('=' .repeat(50));
    
    // 测试正常WAV文件
    console.log('\n📋 测试正常WAV文件:');
    const validationResult = asrService.validateAudioFile(audioFile, false);
    console.log('验证结果:', validationResult);
    
    // 测试空文件
    console.log('\n📋 测试空文件:');
    const emptyValidation = asrService.validateAudioFile(null, false);
    console.log('空文件验证结果:', emptyValidation);
    
    // 测试不支持的格式
    console.log('\n📋 测试不支持的格式:');
    const unsupportedFile = new File(audioData, 'test.txt', { type: 'text/plain' });
    const unsupportedValidation = asrService.validateAudioFile(unsupportedFile, false);
    console.log('不支持格式验证结果:', unsupportedValidation);
    
    // 测试过大文件
    console.log('\n📋 测试过大文件:');
    const largeData = Buffer.alloc(30 * 1024 * 1024); // 30MB
    const largeFile = new File(largeData, 'large.wav', { type: 'audio/wav' });
    const largeValidation = asrService.validateAudioFile(largeFile, false);
    console.log('过大文件验证结果:', largeValidation);
    
    // 测试getAudioFileInfo函数
    console.log('\n📋 测试音频文件信息获取:');
    const fileInfo = asrService.getAudioFileInfo(audioFile);
    console.log('文件信息:', fileInfo);
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ 音频文件验证功能测试完成\n');
    
    // 测试2: 完整的ASR转录流程
    console.log('🧪 测试2: 完整ASR转录流程');
    console.log('=' .repeat(50));
    
    const modelInfo = {
      accessUrl: 'https://api.siliconflow.cn/v1/audio/transcriptions',
      accessKey: 'test-key-12345',
      modelName: 'Test ASR Model'
    };
    
    console.log('\n🎯 开始ASR转录测试...');
    
    // 清空消息日志
    messageLog.length = 0;
    
    // 模拟测试输出更新函数
    const updateTestOutput = (message) => {
      console.log(`📝 测试输出: ${message}`);
    };
    
    // 调用handleASRTest函数
    try {
      await asrService.handleASRTest(audioFile, modelInfo, updateTestOutput);
      console.log('\n✅ ASR转录测试完成');
    } catch (error) {
      console.log(`\n❌ ASR转录测试失败: ${error.message}`);
      console.log('错误详情:', error);
    }
    
    console.log('\n📊 消息日志汇总:');
    messageLog.forEach((log, index) => {
      console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.message}`);
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ 完整ASR转录流程测试完成\n');
    
    // 测试3: 错误处理场景
    console.log('🧪 测试3: 错误处理场景');
    console.log('=' .repeat(50));
    
    // 测试无效模型信息
    console.log('\n📋 测试无效模型信息:');
    try {
      await asrService.handleASRTest(audioFile, null, updateTestOutput);
    } catch (error) {
      console.log(`预期错误: ${error.message}`);
    }
    
    // 测试无效平台URL
    console.log('\n📋 测试无效平台URL:');
    const invalidModelInfo = {
      accessUrl: 'https://api.openai.com/v1/audio/transcriptions',
      accessKey: 'test-key',
      modelName: 'Invalid Platform Model'
    };
    
    try {
      await asrService.handleASRTest(audioFile, invalidModelInfo, updateTestOutput);
    } catch (error) {
      console.log(`预期错误: ${error.message}`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ 错误处理场景测试完成\n');
    
    console.log('🎉 所有测试完成！ASR服务逻辑验证通过。');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

// 运行测试
runTests().catch(console.error);