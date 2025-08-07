import { message } from 'antd';
// 删除错误的导入
// import api from '../utils/api';

/**
 * 发送聊天请求到模型API
 * @param {Array} messages - 消息数组，包含系统消息和用户消息
 * @param {Object} modelInfo - 模型信息对象，包含accessUrl、accessKey、modelName等
 * @param {Function} setTestOutput - 设置测试输出的回调函数
 * @param {Function} setIsStreaming - 设置是否正在流式响应的回调函数
 * @returns {Promise<string>} - 累积的响应内容
 */
export const sendChatRequest = async (messages, modelInfo, setTestOutput, setIsStreaming) => {
  const { accessUrl, accessKey, modelName } = modelInfo;
  
  setTestOutput(`正在连接API...

`);

  try {
    // 发送模型信息给后端，让后端进行流式请求
    const response = await fetch('/api/proxy/model/test', {
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
        messages,
        options: {
          stream: true,
          temperature: 0.7,
          max_tokens: 1000
        }
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
      setTestOutput(`## 测试失败

**错误信息:** ${errorMessage}

**状态码:** ${response.status}

**请检查:**
- API URL 是否正确
- API Key 是否有效
- 模型名称是否正确
- 网络连接是否正常`);
      message.error(errorMessage);
      return '';
    }

    // 后续的流式处理保持不变
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';

    setTestOutput(`## 测试结果

`);

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        setIsStreaming(false);
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split(`\n`);
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            setIsStreaming(false);
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              accumulatedContent += content;
              setTestOutput(accumulatedContent);
            }
          } catch (e) {
            console.warn('JSON解析错误:', e.message);
          }
        }
      }
    }

    if (!accumulatedContent) {
      setTestOutput('模型返回了空响应，请检查输入内容或模型配置。');
      message.warning('模型返回了空响应');
    } else {
      message.success('测试完成');
    }

    return accumulatedContent;
  } catch (error) {
    console.error('测试失败:', error);
    setIsStreaming(false);
    setTestOutput(`## 网络错误

**错误信息:** ${error.message}

**可能原因:**
- 网络连接问题
- CORS跨域限制
- API服务不可用
- 请求超时`);
    message.error(`网络错误: ${error.message}`);
    return '';
  }
};

/**
 * 处理文本测试
 * @param {string} textInput - 用户输入的文本
 * @param {string} systemPrompt - 系统提示词
 * @param {Object} modelInfo - 模型信息对象
 * @param {Function} setTestOutput - 设置输出回调
 * @param {Function} setIsStreaming - 设置流式状态回调
 * @returns {Promise<string>} - 响应内容
 */
export const handleTextTest = async (textInput, systemPrompt, modelInfo, setTestOutput, setIsStreaming) => {
  setIsStreaming(true);
  
  // 构建消息数组
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: textInput });
  
  return await sendChatRequest(
    messages,
    modelInfo,
    setTestOutput,
    setIsStreaming
  );
};

/**
 * 处理多模态测试
 * @param {string} textInput - 用户输入的文本
 * @param {string} systemPrompt - 系统提示词
 * @param {File} file - 媒体文件
 * @param {string} mediaType - 媒体类型
 * @param {Object} modelInfo - 模型信息对象
 * @param {Function} setTestOutput - 设置输出回调
 * @param {Function} setIsStreaming - 设置流式状态回调
 * @returns {Promise<string>} - 响应内容
 */
export const handleMultimodalTest = async (textInput, systemPrompt, file, mediaType, modelInfo, setTestOutput, setIsStreaming) => {
  setIsStreaming(true);
  setTestOutput('正在处理媒体文件...');
  
  // 构建消息数组
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  try {
    // 读取文件并转换为base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // 移除data:image/jpeg;base64,前缀
          const base64 = e.target.result.split(',')[1];
          resolve(base64);
        } catch (error) {
          reject(new Error('文件读取失败'));
        }
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
    
    // 按照OpenAI的multimodal API格式构建内容
    const content = [
      { type: "text", text: textInput || "请描述这个图像/视频" },
      {
        type: mediaType,
        [mediaType === 'image' ? 'image_url' : 'video_url']: {
          url: `data:${file.type};base64,${base64Data}`
        }
      }
    ];
    
    messages.push({
      role: 'user',
      content: content
    });
    
    return await sendChatRequest(
      messages,
      modelInfo,
      setTestOutput,
      setIsStreaming
    );
  } catch (error) {
    console.error('处理多模态测试失败:', error);
    setIsStreaming(false);
    setTestOutput(`## 文件处理错误\n\n**错误信息:** ${error.message}\n\n**可能原因:**\n- 文件格式不支持\n- 文件过大\n- 浏览器限制`);
    return '';
  }
};