import { handleImageGenerationTest } from './src/services/imageGenerationService.js';

// 模拟测试环境
const mockSetTestOutput = (output) => {
  console.log('=== 测试输出 ===');
  console.log(output);
};

const mockSetIsStreaming = (streaming) => {
  console.log(`流式状态: ${streaming}`);
};

// SiliconFlow API测试配置
const testConfig = {
  prompt: "an island near sea, with seagulls, moon shining over the sea, light house, boats in the background, fish flying over the sea",
  systemPrompt: "",
  modelInfo: {
    accessUrl: "https://api.siliconflow.cn/v1",
    accessKey: "your-api-key-here", // 请替换为实际的API Key
    modelName: "Kwai-Kolors/Kolors"
  }
};

// 执行测试
async function testSiliconFlowImageGeneration() {
  console.log('开始测试SiliconFlow图像生成API...');
  console.log('配置信息:', {
    ...testConfig,
    modelInfo: {
      ...testConfig.modelInfo,
      accessKey: testConfig.modelInfo.accessKey.substring(0, 10) + '...'
    }
  });
  
  try {
    await handleImageGenerationTest(
      testConfig.prompt,
      testConfig.systemPrompt,
      testConfig.modelInfo,
      mockSetTestOutput,
      mockSetIsStreaming
    );
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  testSiliconFlowImageGeneration();
}

export { testSiliconFlowImageGeneration };