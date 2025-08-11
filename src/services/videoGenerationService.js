import { message } from 'antd';

/**
 * 处理视频生成测试请求
 * @param {string} prompt - 视频生成提示文本
 * @param {string} systemPrompt - 系统提示文本（部分API支持）
 * @param {Object} modelInfo - 模型信息对象
 * @param {Function} setTestOutput - 设置测试输出的回调函数
 * @param {Function} setIsStreaming - 设置是否正在流式响应的回调函数
 * @returns {Promise<void>}
 */
export const handleVideoGenerationTest = async (
  prompt,
  systemPrompt,
  modelInfo,
  setTestOutput,
  setIsStreaming
) => {
  const { accessUrl, accessKey, modelName } = modelInfo;
  setTestOutput('正在连接API并生成视频...');
  
  try {
    // 构建请求体，支持SiliconFlow API格式
    const requestBody = {
      model: modelName,
      prompt: prompt,
      image_size: '1280x720',  // SiliconFlow文生视频API使用image_size参数
      duration: 5,  // 视频时长（秒）
      fps: 24  // 帧率
    };
    
    // 如果有系统提示，部分API支持
    if (systemPrompt && systemPrompt.trim()) {
      requestBody.system = systemPrompt.trim();
    }
    
    // 通过后台代理发送请求
    const response = await fetch('/api/proxy/video/generation', {
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
        requestBody
      })
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
    
    // 提取生成的视频，支持不同API的响应格式
    let videoUrl;
    let requestId;
    
    if (accessUrl.includes('siliconflow.cn')) {
      // SiliconFlow API响应格式
      if (result.video && result.video.url) {
        videoUrl = result.video.url;
      } else if (result.requestId) {
        // 如果是异步任务，返回请求ID
        requestId = result.requestId;
      }
    } else {
      // 其他API格式的响应
      if (result.data && result.data.length > 0) {
        if (result.data[0].url) {
          videoUrl = result.data[0].url;
        }
      }
    }
    
    if (requestId) {
      // 异步任务处理
      setTestOutput(`## 视频生成中\n\n**请求ID:** ${requestId}\n\n**提示词:** ${prompt}\n\n视频正在生成中，请稍候...`);
      
      // 轮询检查任务状态
      const checkTaskStatus = async () => {
        try {
          const statusResponse = await fetch('/api/proxy/video/status', {
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
              requestId: requestId
            })
          });
          
          if (statusResponse.ok) {
            const statusResult = await statusResponse.json();
            
            if (statusResult.status === 'COMPLETED' && statusResult.video && statusResult.video.url) {
              setTestOutput(`## 生成结果\n\n<video controls width="100%" style="max-width: 800px;">\n  <source src="${statusResult.video.url}" type="video/mp4">\n  您的浏览器不支持视频播放。\n</video>\n\n**提示词:** ${prompt}`);
              setIsStreaming(false);
              message.success('视频生成成功');
            } else if (statusResult.status === 'FAILED') {
              setTestOutput(`## 视频生成失败\n\n**错误信息:** ${statusResult.error || '未知错误'}\n\n**提示词:** ${prompt}`);
              setIsStreaming(false);
              message.error('视频生成失败');
            } else {
              // 继续轮询
              setTimeout(checkTaskStatus, 5000);
            }
          } else {
            setTestOutput(`## 状态查询失败\n\n无法查询任务状态，请手动检查任务进度。\n\n**请求ID:** ${requestId}`);
            setIsStreaming(false);
          }
        } catch (error) {
          console.error('状态查询错误:', error);
          setTestOutput(`## 状态查询错误\n\n**错误信息:** ${error.message}\n\n**请求ID:** ${requestId}`);
          setIsStreaming(false);
        }
      };
      
      // 开始轮询
      setTimeout(checkTaskStatus, 3000);
      
    } else if (videoUrl) {
      // 直接返回视频URL
      setTestOutput(`## 生成结果\n\n<video controls width="100%" style="max-width: 800px;">\n  <source src="${videoUrl}" type="video/mp4">\n  您的浏览器不支持视频播放。\n</video>\n\n**提示词:** ${prompt}`);
      setIsStreaming(false);
      message.success('视频生成成功');
    } else {
      setIsStreaming(false);
      setTestOutput(`## 视频生成失败\n\n未能从API响应中获取视频数据，请检查API响应格式。\n\n**API响应:** \`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``);
      message.error('未能获取生成的视频数据');
      return;
    }
    
  } catch (error) {
    console.error('视频生成测试失败:', error);
    setIsStreaming(false);
    setTestOutput(`## 网络错误\n\n**错误信息:** ${error.message}\n\n**可能原因:**\n- 网络连接问题\n- CORS跨域限制\n- API服务不可用\n- 请求超时`);
    message.error(`网络错误: ${error.message}`);
  }
};