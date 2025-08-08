/**
 * Proxy路由测试用例
 * 使用这个文件来测试不同的场景
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3009';
const API_BASE = `${BASE_URL}/api/proxy`;

// 测试用例数据
const testCases = {
  // 正常的聊天完成请求
  validChatCompletion: {
    accessUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    accessKey: 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot',
    requestBody: {
      model: 'Qwen/Qwen2.5-Coder-32B-Instruct',  // 更新为新的模型名称
      messages: [
        { role: 'user', content: 'Hello, how are you?' }
      ],
      stream: false
    }
  },
  
  // 流式聊天完成请求
  streamChatCompletion: {
    accessUrl: 'https://httpbin.org/delay/1',
    accessKey: 'test-key',
    requestBody: {
      model: 'test-model',
      messages: [
        { role: 'user', content: 'Tell me a short story' }
      ],
      stream: true
    }
  },
  
  // 模型测试请求
  validModelTest: {
    modelInfo: {
      accessUrl: 'https://httpbin.org/post',
      accessKey: 'test-key',
      modelName: 'test-model'
    },
    messages: [
      { role: 'user', content: 'Test message' }
    ],
    options: {
      stream: false,
      temperature: 0.7
    }
  },
  
  // 错误用例：URL格式错误
  invalidUrl: {
    accessUrl: 'not-a-valid-url',
    accessKey: 'test-key',
    requestBody: {
      model: 'test-model',
      messages: [{ role: 'user', content: 'Test' }]
    }
  },
  
  // 错误用例：缺少参数
  missingParams: {
    accessUrl: 'https://httpbin.org/post'
    // 缺少 accessKey 和 requestBody
  },
  
  // 错误用例：URL包含特殊字符
  urlWithSpecialChars: {
    accessUrl: '  "https://httpbin.org/post"  ',
    accessKey: 'test-key',
    requestBody: {
      model: 'test-model',
      messages: [{ role: 'user', content: 'Test' }]
    }
  }
};

// 测试函数
async function runTest(testName, endpoint, data, expectedStatus = 200) {
  console.log(`\n🧪 测试: ${testName}`);
  console.log('=' .repeat(50));
  
  try {
    const startTime = Date.now();
    const response = await axios({
      method: 'POST',
      url: `${API_BASE}${endpoint}`,
      data: data,
      timeout: 30000,
      validateStatus: () => true // 接受所有状态码
    });
    const endTime = Date.now();
    
    console.log(`✅ 请求完成`);
    console.log(`⏱️  响应时间: ${endTime - startTime}ms`);
    console.log(`📊 状态码: ${response.status}`);
    console.log(`📝 响应头: Content-Type = ${response.headers['content-type']}`);
    
    if (response.status === expectedStatus) {
      console.log(`✅ 状态码符合预期 (${expectedStatus})`);
    } else {
      console.log(`⚠️  状态码不符合预期，期望: ${expectedStatus}, 实际: ${response.status}`);
    }
    
    // 显示响应数据（限制长度）
    let responseData = response.data;
    if (typeof responseData === 'string' && responseData.length > 500) {
      responseData = responseData.substring(0, 500) + '...(截断)';
    } else if (typeof responseData === 'object') {
      responseData = JSON.stringify(responseData, null, 2);
      if (responseData.length > 500) {
        responseData = responseData.substring(0, 500) + '...(截断)';
      }
    }
    
    console.log(`📋 响应数据:\n${responseData}`);
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      duration: endTime - startTime
    };
    
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
    if (error.code) {
      console.log(`🔍 错误代码: ${error.code}`);
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// 健康检查测试
async function testHealth() {
  console.log(`\n💚 健康检查测试`);
  console.log('=' .repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log(`✅ 健康检查通过`);
    console.log(`📊 状态码: ${response.status}`);
    console.log(`📋 响应: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    console.log(`❌ 健康检查失败: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始 Proxy 路由测试');
  console.log('=' .repeat(60));
  
  // 检查服务是否运行
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n❌ 服务未运行，请先启动调试服务:');
    console.log('   node debug-proxy.js');
    return;
  }
  
  const results = {};
  
  // 测试聊天完成API
  console.log('\n📡 测试聊天完成API');
  results.chatCompletion = await runTest(
    '正常聊天完成请求',
    '/chat/completions',
    testCases.validChatCompletion,
    200
  );
  
  results.streamChat = await runTest(
    '流式聊天完成请求',
    '/chat/completions',
    testCases.streamChatCompletion,
    200
  );
  
  results.invalidUrl = await runTest(
    'URL格式错误',
    '/chat/completions',
    testCases.invalidUrl,
    400
  );
  
  results.missingParams = await runTest(
    '缺少必要参数',
    '/chat/completions',
    testCases.missingParams,
    400
  );
  
  results.urlSpecialChars = await runTest(
    'URL包含特殊字符',
    '/chat/completions',
    testCases.urlWithSpecialChars,
    200
  );
  
  // 测试模型测试API
  console.log('\n🤖 测试模型测试API');
  results.modelTest = await runTest(
    '正常模型测试请求',
    '/model/test',
    testCases.validModelTest,
    200
  );
  
  // 测试总结
  console.log('\n📊 测试结果总结');
  console.log('=' .repeat(60));
  
  let passCount = 0;
  let totalCount = 0;
  
  Object.entries(results).forEach(([testName, result]) => {
    totalCount++;
    if (result.success) {
      passCount++;
      console.log(`✅ ${testName}: 通过`);
    } else {
      console.log(`❌ ${testName}: 失败 - ${result.error}`);
    }
  });
  
  console.log(`\n📈 总体结果: ${passCount}/${totalCount} 测试通过`);
  
  if (passCount === totalCount) {
    console.log('🎉 所有测试都通过了!');
  } else {
    console.log('⚠️  部分测试失败，请检查日志');
  }
}

// 单独测试函数
const singleTests = {
  async health() {
    await testHealth();
  },
  
  async chatCompletion() {
    await runTest(
      '聊天完成测试',
      '/chat/completions',
      testCases.validChatCompletion
    );
  },
  
  async streamChat() {
    await runTest(
      '流式聊天测试',
      '/chat/completions',
      testCases.streamChatCompletion
    );
  },
  
  async modelTest() {
    await runTest(
      '模型测试',
      '/model/test',
      testCases.validModelTest
    );
  },
  
  async errorCases() {
    console.log('\n🚨 错误用例测试');
    await runTest('URL格式错误', '/chat/completions', testCases.invalidUrl, 400);
    await runTest('缺少参数', '/chat/completions', testCases.missingParams, 400);
  }
};

// 命令行参数处理
const args = process.argv.slice(2);
const testName = args[0];

if (testName && singleTests[testName]) {
  console.log(`🎯 运行单个测试: ${testName}`);
  singleTests[testName]().catch(console.error);
} else if (testName) {
  console.log(`❌ 未知测试: ${testName}`);
  console.log('可用测试:', Object.keys(singleTests).join(', '));
  console.log('或运行 node test-proxy-cases.js 执行所有测试');
} else {
  // 运行所有测试
  runAllTests().catch(console.error);
}

module.exports = { testCases, runTest, runAllTests, singleTests };