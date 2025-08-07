import { message } from 'antd';

/**
 * 处理图像生成测试请求
 * @param {string} prompt - 图像生成提示文本
 * @param {string} systemPrompt - 系统提示文本（部分API支持）
 * @param {Object} modelInfo - 模型信息对象
 * @param {Function} setTestOutput - 设置测试输出的回调函数
 * @param {Function} setIsStreaming - 设置是否正在流式响应的回调函数
 * @returns {Promise<void>}
 */
export const handleImageGenerationTest = async (
  prompt,
  systemPrompt,
  modelInfo,
  setTestOutput,
  setIsStreaming
) => {
  const { accessUrl, accessKey, modelName } = modelInfo;
  setTestOutput('正在连接API并生成图像...');
  
  try {
    // 构建请求体，基于常见的图像生成API格式
    const requestBody = {
      model: modelName,
      prompt: prompt,
      n: 1,  // 生成一张图片
      size: '1024x1024',  // 默认尺寸
      response_format: 'b64_json'  // 请求base64格式便于直接显示
    };
    
    // 如果有系统提示，部分API支持
    if (systemPrompt && systemPrompt.trim()) {
      requestBody.system = systemPrompt.trim();
    }
    
    // 发送请求到图像生成API
    const requestUrl = accessUrl + '/images/generations';
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      let errorMessage = 'API调用失败';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      setIsStreaming(false);
      setTestOutput(`## 测试失败\n\n**错误信息:** ${errorMessage}\n\n**状态码:** ${response.status}\n\n**请检查:**\n- API URL 是否正确\n- API Key 是否有效\n- 模型名称是否正确\n- 网络连接是否正常`);
      message.error(errorMessage);
      return;
    }
    
    const result = await response.json();
    
    // 提取生成的图像（base64格式）
    const generatedImageBase64 = result.data?.[0]?.b64_json;
    if (!generatedImageBase64) {
      setIsStreaming(false);
      setTestOutput('## 图像生成失败\n\n未能从API响应中获取图像数据，请检查API响应格式。');
      message.error('未能获取生成的图像数据');
      return;
    }
    
    // 构建markdown格式的图像显示（使用base64内嵌图像）
    const imageMarkdown = `## 生成结果\n\n![生成的图像](data:image/png;base64,${generatedImageBase64})\n\n**提示词:** ${prompt}`;
    
    setTestOutput(imageMarkdown);
    setIsStreaming(false);
    message.success('图像生成成功');
  } catch (error) {
    console.error('图像生成测试失败:', error);
    setIsStreaming(false);
    setTestOutput(`## 网络错误\n\n**错误信息:** ${error.message}\n\n**可能原因:**\n- 网络连接问题\n- CORS跨域限制\n- API服务不可用\n- 请求超时`);
    message.error(`网络错误: ${error.message}`);
  }
};