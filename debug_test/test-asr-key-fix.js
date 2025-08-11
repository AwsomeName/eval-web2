#!/usr/bin/env node

/**
 * ASR API Key修复验证脚本
 * 测试API Key中\r\n字符的处理
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试用例 - 模拟包含\r\n字符的API Key
const testCases = [
  {
    name: '正常的API Key',
    modelInfo: {
      accessUrl: 'https://api.siliconflow.cn/v1',
      accessKey: 'sk-test-key-12345',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'success'
  },
  {
    name: 'API Key末尾有\\r\\n',
    modelInfo: {
      accessUrl: 'https://api.siliconflow.cn/v1',
      accessKey: 'sk-test-key-12345\r\n',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'success' // 应该被清理后成功
  },
  {
    name: 'API Key开头有空格和\\n',
    modelInfo: {
      accessUrl: 'https://api.siliconflow.cn/v1',
      accessKey: ' \nsk-test-key-12345',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'success'
  },
  {
    name: 'API Key中间有\\t制表符',
    modelInfo: {
      accessUrl: 'https://api.siliconflow.cn/v1',
      accessKey: 'sk-test\t-key-12345',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'success'
  },
  {
    name: 'API Key包含多种空白字符',
    modelInfo: {
      accessUrl: 'https://api.siliconflow.cn/v1',
      accessKey: ' \r\n\tsk-test-key-12345\r\n ',
      modelName: 'FunAudioLLM/SenseVoiceSmall'
    },
    expected: 'success'
  }
];

async function testAPIKeyHandling(testCase) {
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
    console.log(`   原始API Key: "${testCase.modelInfo.accessKey}"`);
    console.log(`   API Key长度: ${testCase.modelInfo.accessKey.length}`);
    console.log(`   包含\\r: ${testCase.modelInfo.accessKey.includes('\r')}`);
    console.log(`   包含\\n: ${testCase.modelInfo.accessKey.includes('\n')}`);
    console.log(`   包含\\t: ${testCase.modelInfo.accessKey.includes('\t')}`);
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
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ 请求成功`);
      console.log(`📝 响应数据:`, JSON.stringify(result, null, 2));
      
      if (testCase.expected === 'success') {
        console.log(`🎯 测试结果: ✅ 符合预期 (成功)`);
        return { success: true, message: '测试通过' };
      } else {
        console.log(`🎯 测试结果: ❌ 不符合预期 (应该失败但成功了)`);
        return { success: false, message: '测试失败：应该失败但成功了' };
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ 请求失败`);
      console.log(`📝 错误响应:`, errorText);
      
      if (testCase.expected === 'error') {
        console.log(`🎯 测试结果: ✅ 符合预期 (失败)`);
        return { success: true, message: '测试通过' };
      } else {
        console.log(`🎯 测试结果: ❌ 不符合预期 (应该成功但失败了)`);
        return { success: false, message: `测试失败：${errorText}` };
      }
    }
    
  } catch (error) {
    console.error(`💥 测试异常:`, error.message);
    
    if (testCase.expected === 'error') {
      console.log(`🎯 测试结果: ✅ 符合预期 (异常)`);
      return { success: true, message: '测试通过' };
    } else {
      console.log(`🎯 测试结果: ❌ 不符合预期 (应该成功但异常了)`);
      return { success: false, message: `测试异常：${error.message}` };
    }
  }
}

async function runAllTests() {
  console.log('🚀 开始ASR API Key修复验证测试...');
  console.log('=' .repeat(80));
  console.log('📋 测试目标: 验证API Key中的\\r\\n字符是否被正确清理');
  console.log('🎯 预期结果: 所有包含特殊字符的API Key都应该被清理后正常工作');
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testAPIKeyHandling(testCase);
    results.push({
      name: testCase.name,
      ...result
    });
    
    // 在测试之间添加短暂延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 汇总结果
  console.log('\n' + '=' .repeat(80));
  console.log('📊 测试结果汇总:');
  console.log('=' .repeat(80));
  
  let passCount = 0;
  let failCount = 0;
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ 通过' : '❌ 失败';
    console.log(`${index + 1}. ${result.name}: ${status}`);
    if (result.success) {
      passCount++;
    } else {
      failCount++;
      console.log(`   错误信息: ${result.message}`);
    }
  });
  
  console.log('\n📈 统计信息:');
  console.log(`   总测试数: ${results.length}`);
  console.log(`   通过数: ${passCount}`);
  console.log(`   失败数: ${failCount}`);
  console.log(`   通过率: ${((passCount / results.length) * 100).toFixed(1)}%`);
  
  if (failCount === 0) {
    console.log('\n🎉 所有测试通过！API Key清理功能工作正常。');
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步检查API Key清理逻辑。');
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('✅ ASR API Key修复验证测试完成');
}

// 运行测试
runAllTests().catch(console.error);