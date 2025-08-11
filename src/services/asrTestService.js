import { message } from 'antd';

/**
 * 处理硅基流动ASR模型测试
 * @param {File} audioFile - 音频文件
 * @param {Object} modelInfo - 模型信息对象，包含accessUrl、accessKey、modelName等
 * @param {Function} setTestOutput - 设置测试输出的回调函数
 * @param {Function} setIsStreaming - 设置是否正在流式响应的回调函数
 * @param {AbortSignal} signal - 用于取消请求的信号
 * @returns {Promise<string>} - 转录结果
 */
export const handleASRTest = async (audioFile, modelInfo, setTestOutput, setIsStreaming = () => {}, signal) => {
  // 添加调试信息
  console.log('ASR测试开始:', {
    fileName: audioFile.name,
    fileSize: audioFile.size,
    fileType: audioFile.type,
    modelInfo: {
      accessUrl: modelInfo.accessUrl,
      modelName: modelInfo.modelName,
      hasAccessKey: !!modelInfo.accessKey
    }
  });
  const { accessUrl, accessKey, modelName } = modelInfo;
  
  setTestOutput('正在上传音频文件并进行转录...');
  if (typeof setIsStreaming === 'function') {
    setIsStreaming(true);
  }

  try {
    // 参数验证
    if (!audioFile) {
      throw new Error('音频文件不能为空');
    }
    
    if (!modelInfo || !accessUrl || !accessKey || !modelName) {
      throw new Error('模型信息不完整，请检查API URL、API Key和模型名称');
    }
    
    // 检查是否为硅基流动平台
    if (!accessUrl.includes('siliconflow.cn')) {
      throw new Error('ASR测试功能目前仅支持硅基流动平台');
    }
    
    // 验证音频文件
    if (!validateAudioFile(audioFile)) {
      throw new Error('音频文件验证失败');
    }

    setTestOutput('正在处理音频文件...');
    console.log('开始处理音频文件:', audioFile.name);

    // 将音频文件转换为base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // 移除data:audio/xxx;base64,前缀
          const result = e.target.result;
          if (!result || typeof result !== 'string') {
            throw new Error('文件读取结果无效');
          }
          
          const base64 = result.split(',')[1];
          if (!base64) {
            throw new Error('Base64数据提取失败');
          }
          
          console.log(`Base64转换完成，数据长度: ${base64.length}`);
          resolve(base64);
        } catch (error) {
          console.error('Base64转换错误:', error);
          reject(new Error(`音频文件读取失败: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader错误:', error);
        reject(new Error('音频文件读取失败'));
      };
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setTestOutput(`正在读取音频文件... ${progress}%`);
        }
      };
      
      reader.readAsDataURL(audioFile);
    });

    setTestOutput('正在连接ASR API...');
    
    const requestPayload = {
      modelInfo: {
        accessUrl,
        accessKey,
        modelName
      },
      audioFile: {
        data: base64Data,
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      }
    };
    
    console.log('发送ASR请求:', {
      url: '/api/proxy/audio/transcriptions',
      modelName,
      audioFileName: audioFile.name,
      audioFileSize: audioFile.size,
      base64Length: base64Data.length
    });

    // 发送请求到后端代理
    const response = await fetch('/api/proxy/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(requestPayload),
      signal // 添加 AbortSignal
    });

    console.log(`API响应状态: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      
      let errorMessage = 'ASR API调用失败';
      let errorDetails = null;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson;
        errorMessage = errorJson.error?.message || errorJson.message || errorJson.error || errorMessage;
      } catch (parseError) {
        console.error('错误响应解析失败:', parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      if (typeof setIsStreaming === 'function') {
        setIsStreaming(false);
      }
      
      let troubleshootingTips = '';
      if (response.status === 401 || response.status === 403) {
        troubleshootingTips = '\n- 检查API Key是否正确\n- 确认API Key是否有ASR权限\n- 检查令牌是否过期';
      } else if (response.status === 400) {
        troubleshootingTips = '\n- 检查音频文件格式是否支持\n- 确认模型名称是否正确\n- 检查请求参数是否完整';
      } else if (response.status >= 500) {
        troubleshootingTips = '\n- API服务暂时不可用\n- 稍后重试\n- 检查网络连接';
      }
      
      const errorOutput = `## ASR测试失败

**错误信息:** ${errorMessage}

**状态码:** ${response.status}

**请检查:**
- API URL 是否正确 (${accessUrl})
- API Key 是否有效
- 模型名称是否正确 (当前: ${modelName})
- 音频文件格式是否支持 (当前: ${audioFile.type})
- 网络连接是否正常${troubleshootingTips}

**详细错误信息:**
\`\`\`json
${JSON.stringify(errorDetails || errorText, null, 2)}
\`\`\``;
      
      setTestOutput(errorOutput);
      message.error(errorMessage);
      return '';
    }

    // 解析响应
    const result = await response.json();
    console.log('ASR API响应:', result);
    
    setIsStreaming(false);
    
    // 格式化输出结果
    const transcriptionText = result.text || '';
    
    if (!transcriptionText) {
      const emptyResultOutput = `## ASR测试完成\n\n**结果:** 未检测到语音内容或转录结果为空\n\n**可能原因:**\n- 音频文件中没有语音内容\n- 音频质量过低\n- 音频格式不兼容\n- 语音过短或过轻\n\n**原始响应:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
      setTestOutput(emptyResultOutput);
      message.warning('转录结果为空');
      return '';
    }

    // 构建详细的输出信息
    let outputContent = `## ASR转录结果\n\n**转录文本:**\n${transcriptionText}\n\n`;
    
    // 添加基本信息
    const audioInfo = `**音频文件信息:**\n- 文件名: ${audioFile.name}\n- 文件大小: ${(audioFile.size / 1024 / 1024).toFixed(2)} MB\n- 文件格式: ${audioFile.type}\n\n`;
    outputContent += audioInfo;
    
    // 如果有其他信息，也显示出来
    if (result.language) {
      outputContent += `**检测语言:** ${result.language}\n\n`;
    }
    
    if (result.duration) {
      outputContent += `**音频时长:** ${result.duration}秒\n\n`;
    }
    
    // 如果有分段信息，显示分段
    if (result.segments && Array.isArray(result.segments) && result.segments.length > 0) {
      outputContent += `**分段信息:** (${result.segments.length}个分段)\n`;
      result.segments.forEach((segment, index) => {
        outputContent += `${index + 1}. [${segment.start}s - ${segment.end}s] ${segment.text}\n`;
      });
      outputContent += '\n';
    }
    
    // 显示模型信息
    outputContent += `**模型信息:**\n- 模型名称: ${modelName}\n- API地址: ${accessUrl}\n\n`;
    
    // 显示原始响应（用于调试）
    outputContent += `**原始响应:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
    
    setTestOutput(outputContent);
    message.success(`ASR转录完成: ${transcriptionText.substring(0, 50)}${transcriptionText.length > 50 ? '...' : ''}`);
    
    return transcriptionText;
    
  } catch (error) {
    console.error('ASR测试异常:', error);
    
    // 检查是否是取消请求导致的错误
    if (error.name === 'AbortError') {
      setTestOutput(prev => prev + '\n\n**请求已手动停止**');
      message.info('请求已手动停止');
      throw error;
    }
    
    setIsStreaming(false);
    
    // 根据错误类型提供不同的处理建议
    let errorCategory = '未知错误';
    let suggestions = [];
    
    if (error.message.includes('网络') || error.message.includes('fetch')) {
      errorCategory = '网络连接错误';
      suggestions = [
        '检查网络连接是否正常',
        '确认后端服务是否运行',
        '检查防火墙设置',
        '尝试刷新页面重试'
      ];
    } else if (error.message.includes('音频文件') || error.message.includes('Base64')) {
      errorCategory = '文件处理错误';
      suggestions = [
        '检查音频文件是否损坏',
        '尝试使用其他音频文件',
        '确认文件格式是否支持',
        '检查文件大小是否超限'
      ];
    } else if (error.message.includes('模型信息') || error.message.includes('参数')) {
      errorCategory = '配置错误';
      suggestions = [
        '检查API URL是否正确',
        '确认API Key是否有效',
        '验证模型名称是否正确',
        '检查所有必填参数'
      ];
    } else if (error.message.includes('超时') || error.message.includes('timeout')) {
      errorCategory = '请求超时';
      suggestions = [
        '检查网络连接速度',
        '尝试使用较小的音频文件',
        '稍后重试',
        '联系管理员检查服务状态'
      ];
    } else {
      suggestions = [
        '检查浏览器控制台错误信息',
        '尝试刷新页面重试',
        '联系技术支持',
        '查看详细错误日志'
      ];
    }
    
    const errorOutput = `## ASR测试错误\n\n**错误类型:** ${errorCategory}\n\n**错误信息:** ${error.message}\n\n**建议解决方案:**\n${suggestions.map(s => `- ${s}`).join('\n')}\n\n**技术详情:**\n- 错误名称: ${error.name}\n- 发生时间: ${new Date().toLocaleString()}\n- 音频文件: ${audioFile?.name || '未知'}\n- 模型: ${modelInfo?.modelName || '未知'}\n\n**错误堆栈:**\n\`\`\`\n${error.stack || '无堆栈信息'}\n\`\`\``;
    
    setTestOutput(errorOutput);
    message.error(`${errorCategory}: ${error.message}`);
    return '';
  }
};

/**
 * 验证音频文件格式和大小
 * @param {File} file - 音频文件
 * @param {boolean} showMessages - 是否显示错误消息，默认为true
 * @returns {Object} - 验证结果对象，包含isValid、errors、warnings等信息
 */
export const validateAudioFile = (file, showMessages = true) => {
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

/**
 * 获取音频文件的详细信息
 * @param {File} file - 音频文件
 * @returns {Object} - 文件详细信息
 */
export const getAudioFileInfo = (file) => {
  if (!file) return null;
  
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    sizeInMB: (file.size / 1024 / 1024).toFixed(2),
    sizeInKB: (file.size / 1024).toFixed(2),
    lastModified: file.lastModified ? new Date(file.lastModified).toLocaleString() : '未知',
    extension: file.name ? file.name.split('.').pop()?.toLowerCase() : '未知'
  };
};