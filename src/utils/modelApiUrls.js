// 根据模型类型获取预定义的API URL选项
export const getPredefinedApiUrls = (modelType) => {
  const baseUrls = [];
  
  // 根据模型类型调整各个API提供商的URL
  if (modelType === 'image') {
    // 图像生成模型的专用端点
    baseUrls.push(
      { label: 'OpenAI', value: 'https://api.openai.com/v1' },
      { label: 'Azure OpenAI', value: 'https://your-resource-name.openai.azure.com' },
      { label: '硅基流动', value: 'https://api.siliconflow.cn/v1' },
      { label: '智谱AI', value: 'https://open.bigmodel.cn/api/paas/v4' },
      { label: '阿里云', value: 'https://dashscope.aliyuncs.com/api/v1' },
      { label: '青云聚合', value: 'https://api.qingyuntop.top/v1/images/generations' }
    );
  } else if (modelType === 'video') {
    // 视频生成模型的专用端点
    baseUrls.push(
      { label: '硅基流动', value: 'https://api.siliconflow.cn/v1' },
      { label: 'OpenAI', value: 'https://api.openai.com/v1' },
      { label: 'Azure OpenAI', value: 'https://your-resource-name.openai.azure.com' },
      { label: '智谱AI', value: 'https://open.bigmodel.cn/api/paas/v4' },
      { label: '阿里云', value: 'https://dashscope.aliyuncs.com/api/v1' }
    );
  } else if (modelType === 'asr') {
    // ASR语音识别模型的专用端点
    baseUrls.push(
      { label: '硅基流动', value: 'https://api.siliconflow.cn/v1/audio/transcriptions' },
      { label: 'OpenAI', value: 'https://api.openai.com/v1/audio/transcriptions' }
    );
  } else if (modelType === 'tts') {
    // TTS语音合成模型的专用端点
    baseUrls.push(
      { label: '硅基流动', value: 'https://api.siliconflow.cn/v1/audio/speech' },
      { label: 'OpenAI', value: 'https://api.openai.com/v1/audio/speech' }
    );
  } else if (modelType === 'rerank') {
    // Rerank重排序模型的专用端点
    baseUrls.push(
      { label: '硅基流动', value: 'https://api.siliconflow.cn/v1/rerank' },
      { label: '青云聚合', value: 'https://api.qingyuntop.top/v1/rerank' }
    );
  } else if (modelType === 'embedding') {
    // Embedding嵌入模型的专用端点
    baseUrls.push(
      { label: '硅基流动', value: 'https://api.siliconflow.cn/v1/embeddings' },
      { label: 'OpenAI', value: 'https://api.openai.com/v1/embeddings' },
      { label: '智谱AI', value: 'https://open.bigmodel.cn/api/paas/v4/embeddings' },
      { label: '阿里云', value: 'https://dashscope.aliyuncs.com/api/v1/services/embeddings' }
    );
  } else {
    // 其他模型类型的通用端点
    baseUrls.push(
      { label: 'OpenAI', value: 'https://api.openai.com/v1' },
      { label: 'Azure OpenAI', value: 'https://your-resource-name.openai.azure.com' },
      { label: 'Anthropic', value: 'https://api.anthropic.com' },
      { label: '百度文心', value: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop' },
      { label: '智谱AI', value: 'https://open.bigmodel.cn/api/paas/v3' },
      { label: '阿里云', value: 'https://dashscope.aliyuncs.com/api/v1' },
      { label: '硅基流动', value: 'https://api.siliconflow.cn/v1' },
      { label: '青云聚合', value: 'https://api.qingyuntop.top/v1' }
    );
  }
  
  return baseUrls;
};

// 默认的API URL选项（用于初始化）
export const predefinedApiUrls = getPredefinedApiUrls('text');