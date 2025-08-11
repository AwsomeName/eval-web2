#!/usr/bin/env node

/**
 * ASR服务修复验证脚本
 * 测试URL清理、超时处理和错误处理改进
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试用例
const testCases = [
  {
    name: '正常的SiliconFlow URL',
    modelInfo: {
      accessUrl: 'https://api.siliconflow.cn/v1',
      accessKey: 'sk-test-key-12345',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'success'
  },
  {
    name: '带括号的错误URL（用户遇到的问题）',
    modelInfo: {
      accessUrl: 'https://api.siliconflow.cn/v1)',
      accessKey: 'sk-test-key-12345',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'success' // 应该被清理后成功
  },
  {
    name: '带空格的URL',
    modelInfo: {
      accessUrl: ' https://api.siliconflow.cn/v1 ',
      accessKey: 'sk-test-key-12345',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'success'
  },
  {
    name: '带引号的URL',
    modelInfo: {
      accessUrl: '"https://api.siliconflow.cn/v1"',
      accessKey: 'sk-test-key-12345',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'success'
  },
  {
    name: '完全错误的URL格式',
    modelInfo: {
      accessUrl: 'not-a-valid-url',
      accessKey: 'sk-test-key-12345',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'error'
  },
  {
    name: '非SiliconFlow平台',
    modelInfo: {
      accessUrl: 'https://api.openai.com/v1',
      accessKey: 'sk-test-key-12345',
      modelName: 'whisper-1'
    },
    expected: 'error'
  }
];

async function testASREndpoint(testCase) {
  console.log(`\n🧪 测试: ${testCase.name}`);
  console.log('=' .repeat(60));
  
  try {
    // 准备测试音频文件
    const audioFilePath = '/home/lc/eval-web2/test_data/20250811_105907.wav';
    
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`音频文件不存在: ${audioFilePath}`);
    }
    
    const audioData = fs.readFileSync(audioFilePath);
    const base64Data = audioData.toString('base64');
    
    const requestPayload = {
      modelInfo: testCase.modelInfo,
      audioFile: {
        data: base64Data,
        name: '20250811_105907.wav',
        type: 'audio/wav',
        size: audioData.length
      }
    };
    
    console.log(`📤 请求信息:`);
    console.log(`   URL: ${testCase.modelInfo.accessUrl}`);
    console.log(`   模型: ${testCase.modelInfo.modelName}`);
    console.log(`   音频大小: ${(audioData.length / 1024 / 1024).toFixed(2)} MB`);
    
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3001/api/proxy/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // 使用测试token
      },
      body: JSON.stringify(requestPayload)
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  响应时间: ${duration}ms`);
    console.log(`📊 状态码: ${response.status}`);
    
    const responseData = await response.text();
    let parsedData;
    
    try {
      parsedData = JSON.parse(responseData);
    } catch (e) {
      parsedData = responseData;
    }
    
    if (response.ok) {
      console.log(`✅ 请求成功`);
      if (testCase.expected === 'success') {
        console.log(`✅ 结果符合预期`);
      } else {
        console.log(`⚠️  结果不符合预期，期望失败但成功了`);
      }
      
      if (parsedData.text) {
        console.log(`📝 转录结果: ${parsedData.text}`);
      }
    } else {
      console.log(`❌ 请求失败`);
      if (testCase.expected === 'error') {
        console.log(`✅ 结果符合预期`);
      } else {
        console.log(`⚠️  结果不符合预期，期望成功但失败了`);
      }
      
      console.log(`📋 错误信息:`);
      if (typeof parsedData === 'object') {
        console.log(JSON.stringify(parsedData, null, 2));
      } else {
        console.log(parsedData);
      }
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: parsedData,
      duration,
      expectedResult: testCase.expected
    };
    
  } catch (error) {
    console.log(`❌ 测试异常: ${error.message}`);
    
    if (testCase.expected === 'error') {
      console.log(`✅ 结果符合预期（异常）`);
    } else {
      console.log(`⚠️  结果不符合预期，期望成功但出现异常`);
    }
    
    return {
      success: false,
      error: error.message,
      expectedResult: testCase.expected
    };
  }
}

async function runAllTests() {
  console.log('🚀 开始ASR服务修复验证测试\n');
  
  // 检查后端服务是否运行
  try {
    const healthCheck = await fetch('http://localhost:3001/api/health');
    if (healthCheck.ok) {
      console.log('✅ 后端服务运行正常\n');
    } else {
      throw new Error('后端服务健康检查失败');
    }
  } catch (error) {
    console.error('❌ 后端服务不可用:', error.message);
    console.log('请确保后端服务在端口3001上运行');
    process.exit(1);
  }
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testASREndpoint(testCase);
    results.push({
      name: testCase.name,
      ...result
    });
    
    // 等待一下避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 汇总结果
  console.log('\n' + '=' .repeat(80));
  console.log('📊 测试结果汇总');
  console.log('=' .repeat(80));
  
  let passCount = 0;
  let failCount = 0;
  
  results.forEach((result, index) => {
    const testCase = testCases[index];
    const isExpectedResult = 
      (testCase.expected === 'success' && result.success) ||
      (testCase.expected === 'error' && !result.success);
    
    if (isExpectedResult) {
      console.log(`✅ ${result.name}`);
      passCount++;
    } else {
      console.log(`❌ ${result.name}`);
      failCount++;
    }
    
    if (result.duration) {
      console.log(`   响应时间: ${result.duration}ms`);
    }
    
    if (result.status) {
      console.log(`   状态码: ${result.status}`);
    }
    
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
    
    console.log('');
  });
  
  console.log(`📈 总计: ${passCount + failCount} 个测试`);
  console.log(`✅ 通过: ${passCount}`);
  console.log(`❌ 失败: ${failCount}`);
  
  if (failCount === 0) {
    console.log('\n🎉 所有测试通过！ASR服务修复验证成功。');
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步检查。');
  }
  
  // 特别检查URL清理功能
  console.log('\n' + '=' .repeat(80));
  console.log('🔧 URL清理功能验证');
  console.log('=' .repeat(80));
  
  const urlCleaningTest = results.find(r => r.name.includes('带括号的错误URL'));
  if (urlCleaningTest && urlCleaningTest.success) {
    console.log('✅ URL清理功能正常工作 - 成功处理了带括号的URL');
  } else {
    console.log('❌ URL清理功能可能存在问题');
  }
  
  const spaceUrlTest = results.find(r => r.name.includes('带空格的URL'));
  if (spaceUrlTest && spaceUrlTest.success) {
    console.log('✅ 空格清理功能正常工作');
  } else {
    console.log('❌ 空格清理功能可能存在问题');
  }
  
  const quoteUrlTest = results.find(r => r.name.includes('带引号的URL'));
  if (quoteUrlTest && quoteUrlTest.success) {
    console.log('✅ 引号清理功能正常工作');
  } else {
    console.log('❌ 引号清理功能可能存在问题');
  }
}

// 运行测试
runAllTests().catch(console.error);