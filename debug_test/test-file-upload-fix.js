#!/usr/bin/env node

/**
 * ASR文件上传修复验证测试
 * 测试文件上传组件的beforeUpload逻辑是否正确处理文件验证
 */

import fs from 'fs';
import path from 'path';

// 模拟antd的Upload组件常量
const Upload = {
  LIST_IGNORE: 'LIST_IGNORE'
};

// 模拟message组件
const message = {
  error: (msg) => console.log(`❌ Error: ${msg}`),
  warning: (msg) => console.log(`⚠️  Warning: ${msg}`),
  success: (msg) => console.log(`✅ Success: ${msg}`)
};

// 模拟File对象
class MockFile {
  constructor(buffer, name, options = {}) {
    this.name = name;
    this.size = buffer.length;
    this.type = options.type || 'application/octet-stream';
    this.lastModified = Date.now();
    this.buffer = buffer;
  }
}

// 复制validateAudioFile函数逻辑
const validateAudioFile = (file, showMessages = true) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    fileInfo: {
      name: file?.name || '未知',
      size: file?.size || 0,
      type: file?.type || '未知',
      sizeInMB: file?.size ? (file.size / 1024 / 1024).toFixed(2) : '0'
    }
  };
  
  // 基本文件检查
  if (!file) {
    result.isValid = false;
    result.errors.push('文件对象为空');
    if (showMessages) message.error('请选择音频文件');
    return result;
  }
  
  if (!file.name) {
    result.warnings.push('文件名为空');
  }
  
  if (file.size === 0) {
    result.isValid = false;
    result.errors.push('文件大小为0');
    if (showMessages) message.error('音频文件为空，请选择有效的音频文件');
    return result;
  }
  
  // 支持的音频格式
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
  
  const formatNames = {
    'audio/mpeg': 'MP3',
    'audio/mp3': 'MP3',
    'audio/wav': 'WAV',
    'audio/flac': 'FLAC',
    'audio/aac': 'AAC',
    'audio/ogg': 'OGG',
    'audio/webm': 'WebM',
    'audio/m4a': 'M4A'
  };
  
  // 检查文件格式
  if (!supportedFormats.includes(file.type)) {
    result.isValid = false;
    const supportedNames = Object.values(formatNames).join('、');
    const errorMsg = `不支持的音频格式 (${file.type})，请上传 ${supportedNames} 格式的音频文件`;
    result.errors.push(errorMsg);
    if (showMessages) message.error(errorMsg);
  }
  
  // 检查文件大小（限制为25MB）
  const maxSize = 25 * 1024 * 1024; // 25MB
  const minSize = 1024; // 1KB
  
  if (file.size > maxSize) {
    result.isValid = false;
    const errorMsg = `音频文件过大 (${result.fileInfo.sizeInMB}MB)，请上传小于25MB的文件`;
    result.errors.push(errorMsg);
    if (showMessages) message.error(errorMsg);
  } else if (file.size < minSize) {
    result.warnings.push(`文件较小 (${result.fileInfo.sizeInMB}MB)，可能不包含有效音频内容`);
  }
  
  // 文件名扩展名检查（额外验证）
  if (file.name) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'webm', 'm4a'];
    
    if (extension && !validExtensions.includes(extension)) {
      result.warnings.push(`文件扩展名 (.${extension}) 可能不匹配文件类型 (${file.type})`);
    }
  }
  
  // 记录验证结果
  console.log('音频文件验证结果:', result);
  
  // 显示警告信息
  if (showMessages && result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      message.warning(warning);
    });
  }
  
  // 为了保持向后兼容，返回布尔值
  if (typeof showMessages === 'undefined' || showMessages === true) {
    return result.isValid;
  }
  
  return result;
};

// 模拟修复后的beforeUpload逻辑
const beforeUploadFixed = (file) => {
  const isValid = validateAudioFile(file);
  return isValid ? false : Upload.LIST_IGNORE;
};

// 模拟原来的beforeUpload逻辑（有问题的版本）
const beforeUploadOriginal = validateAudioFile;

// 测试函数
async function testFileUploadFix() {
  console.log('🧪 ASR文件上传修复验证测试');
  console.log('=' .repeat(60));
  
  // 测试用例
  const testCases = [
    {
      name: '正常WAV文件',
      file: new MockFile(Buffer.alloc(1024 * 100), 'test.wav', { type: 'audio/wav' }), // 100KB
      expectedValid: true
    },
    {
      name: '空文件',
      file: new MockFile(Buffer.alloc(0), 'empty.wav', { type: 'audio/wav' }),
      expectedValid: false
    },
    {
      name: '不支持的格式',
      file: new MockFile(Buffer.alloc(1024), 'test.txt', { type: 'text/plain' }),
      expectedValid: false
    },
    {
      name: '过大文件',
      file: new MockFile(Buffer.alloc(30 * 1024 * 1024), 'large.wav', { type: 'audio/wav' }), // 30MB
      expectedValid: false
    },
    {
      name: '过小文件（警告）',
      file: new MockFile(Buffer.alloc(500), 'small.wav', { type: 'audio/wav' }), // 500B
      expectedValid: true // 应该通过验证，但有警告
    }
  ];
  
  console.log('\n📋 测试beforeUpload逻辑修复:');
  console.log('-' .repeat(40));
  
  for (const testCase of testCases) {
    console.log(`\n🧪 测试: ${testCase.name}`);
    console.log('=' .repeat(30));
    
    // 测试原来的逻辑
    console.log('\n📤 原始beforeUpload逻辑:');
    const originalResult = beforeUploadOriginal(testCase.file);
    console.log(`   返回值: ${originalResult}`);
    console.log(`   类型: ${typeof originalResult}`);
    
    // 测试修复后的逻辑
    console.log('\n🔧 修复后beforeUpload逻辑:');
    const fixedResult = beforeUploadFixed(testCase.file);
    console.log(`   返回值: ${fixedResult}`);
    console.log(`   类型: ${typeof fixedResult}`);
    
    // 分析结果
    console.log('\n📊 结果分析:');
    if (testCase.expectedValid) {
      // 期望文件有效
      const originalCorrect = originalResult === true;
      const fixedCorrect = fixedResult === false; // 修复后应该返回false来阻止自动上传
      
      console.log(`   期望: 文件有效，应该被接受`);
      console.log(`   原始逻辑: ${originalCorrect ? '✅ 正确' : '❌ 错误'} (返回 ${originalResult})`);
      console.log(`   修复逻辑: ${fixedCorrect ? '✅ 正确' : '❌ 错误'} (返回 ${fixedResult})`);
    } else {
      // 期望文件无效
      const originalCorrect = originalResult === false;
      const fixedCorrect = fixedResult === Upload.LIST_IGNORE; // 修复后应该返回LIST_IGNORE来忽略文件
      
      console.log(`   期望: 文件无效，应该被拒绝`);
      console.log(`   原始逻辑: ${originalCorrect ? '✅ 正确' : '❌ 错误'} (返回 ${originalResult})`);
      console.log(`   修复逻辑: ${fixedCorrect ? '✅ 正确' : '❌ 错误'} (返回 ${fixedResult})`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 测试总结:');
  console.log('=' .repeat(60));
  
  console.log('\n🔍 问题分析:');
  console.log('1. 原始逻辑问题:');
  console.log('   - 直接使用validateAudioFile作为beforeUpload');
  console.log('   - 当文件有效时返回true，Upload组件会自动上传');
  console.log('   - 当文件无效时返回false，Upload组件会忽略文件');
  console.log('   - 这导致有效文件被自动上传，但我们需要手动控制上传');
  
  console.log('\n2. 修复后逻辑:');
  console.log('   - 使用包装函数处理validateAudioFile的返回值');
  console.log('   - 当文件有效时返回false，阻止自动上传但保留文件在列表中');
  console.log('   - 当文件无效时返回Upload.LIST_IGNORE，完全忽略文件');
  console.log('   - 这样可以正确控制文件上传行为');
  
  console.log('\n✅ 修复验证完成!');
  console.log('\n📝 建议:');
  console.log('1. 确保Upload组件正确导入了Upload.LIST_IGNORE');
  console.log('2. 测试实际文件上传功能，确认文件能正确添加到fileList');
  console.log('3. 验证ASR测试能正确获取到audioFile.originFileObj');
}

// 运行测试
testFileUploadFix().catch(console.error);