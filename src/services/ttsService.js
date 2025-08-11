import { message } from 'antd';

/**
 * 处理TTS语音合成测试请求
 * @param {string} textInput - 要合成的文本内容
 * @param {Object} modelInfo - 模型信息对象，包含accessUrl、accessKey、modelName等
 * @param {Function} setTestOutput - 设置测试输出的回调函数
 * @param {Function} setIsStreaming - 设置是否正在流式响应的回调函数
 * @param {AbortSignal} signal - 用于取消请求的信号
 * @returns {Promise<void>}
 */
export const handleTTSTest = async (
  textInput,
  modelInfo,
  setTestOutput,
  setIsStreaming = () => {},
  signal
) => {
  // 添加调试信息
  console.log('TTS测试开始:', {
    textLength: textInput.length,
    modelInfo: {
      accessUrl: modelInfo.accessUrl,
      modelName: modelInfo.modelName,
      hasAccessKey: !!modelInfo.accessKey
    }
  });
  
  const { accessUrl, accessKey, modelName } = modelInfo;
  
  setTestOutput('正在连接API并生成语音...');
  if (typeof setIsStreaming === 'function') {
    setIsStreaming(true);
  }

  try {
    // 参数验证
    if (!textInput || !textInput.trim()) {
      throw new Error('文本内容不能为空');
    }
    
    if (!modelInfo || !accessUrl || !accessKey || !modelName) {
      throw new Error('模型信息不完整，请检查API URL、API Key和模型名称');
    }
    
    // 检查是否为硅基流动平台
    if (!accessUrl.includes('siliconflow.cn')) {
      throw new Error('TTS测试功能目前仅支持硅基流动平台');
    }
    
    // 构建请求体，支持硅基流动TTS API格式
    const requestBody = {
      model: modelName,
      input: textInput.trim(),
      voice: `${modelName}:alex`, // 使用模型特定的声音格式
      response_format: 'mp3', // 音频格式
      speed: 1.0 // 语速
    };
    
    console.log('TTS请求参数:', {
      model: requestBody.model,
      inputLength: requestBody.input.length,
      voice: requestBody.voice,
      format: requestBody.response_format
    });
    
    // 通过后台代理发送请求
    const response = await fetch('/api/proxy/tts/speech', {
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
      }),
      signal // 添加 AbortSignal 支持
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'TTS API调用失败';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
        
        // 根据错误状态码提供更具体的错误信息
        if (response.status === 401) {
          errorMessage = 'API密钥无效或已过期，请检查API Key配置';
        } else if (response.status === 403) {
          errorMessage = 'API密钥权限不足，请检查是否有TTS模型的访问权限';
        } else if (response.status === 429) {
          errorMessage = 'API调用频率超限，请稍后重试';
        } else if (response.status === 500) {
          errorMessage = 'API服务器内部错误，请稍后重试';
        }
      } catch (e) {
        // 如果无法解析错误响应，使用默认错误信息
        console.warn('无法解析错误响应:', e);
      }
      
      throw new Error(`${errorMessage} (状态码: ${response.status})`);
    }
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('audio/')) {
      // 处理音频响应
      const audioBlob = await response.blob();
      
      // 验证音频blob
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('接收到的音频数据为空');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 创建下载函数
      const downloadAudio = () => {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `tts-${modelName}-${Date.now()}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      // 清理之前的blob URL（如果存在）
      if (window.currentTTSAudioUrl) {
        URL.revokeObjectURL(window.currentTTSAudioUrl);
      }
      
      // 保存当前的blob URL以便后续清理
      window.currentTTSAudioUrl = audioUrl;
      
      // 将下载函数绑定到全局对象，以便在Markdown中调用
      window.downloadTTSAudio = downloadAudio;
      
      // 添加页面卸载时的清理函数
      if (!window.ttsCleanupRegistered) {
        window.addEventListener('beforeunload', () => {
          if (window.currentTTSAudioUrl) {
            URL.revokeObjectURL(window.currentTTSAudioUrl);
          }
        });
        window.ttsCleanupRegistered = true;
      }
      
      // 验证音频URL是否有效
      console.log('生成的音频URL:', audioUrl);
      console.log('音频Blob类型:', audioBlob.type);
      console.log('音频Blob大小:', audioBlob.size);
      
      // 检查浏览器兼容性
      const audioElement = document.createElement('audio');
      const canPlayMp3 = audioElement.canPlayType('audio/mpeg');
      const canPlayWav = audioElement.canPlayType('audio/wav');
      const supportsBlobUrls = window.URL && typeof window.URL.createObjectURL === 'function';
      
      console.log('浏览器音频支持:', {
        canPlayMp3: canPlayMp3,
        canPlayWav: canPlayWav,
        supportsBlobUrls: supportsBlobUrls,
        userAgent: navigator.userAgent
      });
      
      // 如果浏览器不支持blob URLs，显示警告
      if (!supportsBlobUrls) {
        console.warn('浏览器不支持Blob URLs，音频播放可能失败');
      }
      
      // 构建浏览器兼容性信息
      let compatibilityInfo = '';
      if (!supportsBlobUrls) {
        compatibilityInfo = '\n\n⚠️ **浏览器兼容性警告:** 您的浏览器可能不支持Blob URLs，音频播放功能可能无法正常工作。';
      } else if (canPlayMp3 === '' || canPlayMp3 === 'no') {
        compatibilityInfo = '\n\n⚠️ **音频格式警告:** 您的浏览器可能不支持MP3格式，请尝试下载文件后使用其他播放器播放。';
      }
      
      // 构建成功的输出信息
      const outputContent = `## TTS语音合成结果\n\n**合成状态:** ✅ 成功\n\n**输入文本:** ${textInput}\n\n**模型:** ${modelName}\n\n**音频格式:** ${requestBody.response_format}\n\n**音频大小:** ${(audioBlob.size / 1024).toFixed(2)} KB\n\n**浏览器支持:** MP3格式支持度 - ${canPlayMp3 || '未知'}${compatibilityInfo}\n\n**播放音频:**\n\n<audio controls preload="auto" style="width: 100%; max-width: 400px;" onloadstart="console.log('TTS音频开始加载')" oncanplay="console.log('TTS音频可以播放')" onerror="console.error('TTS音频加载失败', event)">\n  <source src="${audioUrl}" type="${audioBlob.type || 'audio/mpeg'}">\n  您的浏览器不支持音频播放。请点击下载按钮获取音频文件。\n</audio>\n\n**下载链接:** <button onclick="window.downloadTTSAudio()" style="background: #1890ff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">点击下载音频文件</button>\n\n---\n\n*注意：音频文件将在页面刷新后失效，请及时下载保存。*`;
      
      setTestOutput(outputContent);
      message.success('TTS语音合成完成');
      
      console.log('TTS合成成功:', {
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
        audioUrl: audioUrl
      });
      
    } else {
      // 处理JSON响应（可能包含错误信息）
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // 如果有其他格式的成功响应
      const outputContent = `## TTS语音合成结果\n\n**合成状态:** ✅ 完成\n\n**响应数据:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
      setTestOutput(outputContent);
      message.success('TTS请求完成');
    }
    
  } catch (error) {
    console.error('TTS测试失败:', error);
    
    if (typeof setIsStreaming === 'function') {
      setIsStreaming(false);
    }
    
    // 处理不同类型的错误
    let errorMessage = error.message || 'TTS测试失败';
    let errorDetails = '';
    
    if (error.name === 'AbortError') {
      errorMessage = '请求已被取消';
      message.info('TTS请求已取消');
    } else if (error.message.includes('网络')) {
      errorDetails = '\n\n**可能原因:**\n- 网络连接问题\n- API服务不可用\n- 请求超时';
      message.error('网络连接失败');
    } else if (error.message.includes('API密钥')) {
      errorDetails = '\n\n**解决方案:**\n- 检查API Key是否正确\n- 确认API Key是否有TTS权限\n- 检查API Key是否已过期';
      message.error('API密钥问题');
    } else {
      message.error('TTS测试失败');
    }
    
    const outputContent = `## TTS测试失败\n\n**错误信息:** ${errorMessage}${errorDetails}\n\n**技术详情:**\n- 时间: ${new Date().toLocaleString()}\n- 模型: ${modelName || 'N/A'}\n- 文本长度: ${textInput ? textInput.length : 0} 字符`;
    
    setTestOutput(outputContent);
    
    // 重新抛出错误以便上层处理
    throw error;
  } finally {
    if (typeof setIsStreaming === 'function') {
      setIsStreaming(false);
    }
  }
};

/**
 * 验证TTS输入文本
 * @param {string} text - 要验证的文本
 * @param {boolean} showMessages - 是否显示消息提示
 * @returns {Object} 验证结果对象
 */
export const validateTTSText = (text, showMessages = true) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    textInfo: {
      length: text ? text.length : 0,
      wordCount: text ? text.trim().split(/\s+/).length : 0,
      isEmpty: !text || !text.trim()
    }
  };
  
  // 检查文本是否为空
  if (!text || !text.trim()) {
    result.isValid = false;
    result.errors.push('文本内容不能为空');
    if (showMessages) {
      message.error('请输入要合成的文本内容');
    }
    return result;
  }
  
  // 检查文本长度
  if (text.length > 4000) {
    result.isValid = false;
    result.errors.push('文本长度超过限制（最大4000字符）');
    if (showMessages) {
      message.error('文本内容过长，请控制在4000字符以内');
    }
  } else if (text.length > 2000) {
    result.warnings.push('文本较长，合成可能需要更多时间');
    if (showMessages) {
      message.warning('文本较长，合成可能需要更多时间');
    }
  }
  
  // 检查特殊字符
  const specialChars = /[<>{}\[\]]/g;
  if (specialChars.test(text)) {
    result.warnings.push('文本包含特殊字符，可能影响合成效果');
    if (showMessages) {
      message.warning('文本包含特殊字符，可能影响合成效果');
    }
  }
  
  return result;
};

/**
 * 获取TTS文本信息
 * @param {string} text - 文本内容
 * @returns {Object} 文本信息对象
 */
export const getTTSTextInfo = (text) => {
  if (!text) {
    return {
      length: 0,
      wordCount: 0,
      estimatedDuration: 0,
      isEmpty: true
    };
  }
  
  const trimmedText = text.trim();
  const wordCount = trimmedText.split(/\s+/).length;
  
  // 估算语音时长（基于平均语速）
  // 中文：约4-5字/秒，英文：约2-3词/秒
  const chineseChars = (trimmedText.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = wordCount - chineseChars;
  const estimatedDuration = Math.ceil((chineseChars / 4.5) + (englishWords / 2.5));
  
  return {
    length: text.length,
    wordCount: wordCount,
    chineseChars: chineseChars,
    estimatedDuration: estimatedDuration,
    isEmpty: !trimmedText
  };
};