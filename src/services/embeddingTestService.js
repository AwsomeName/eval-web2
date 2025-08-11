import { message } from 'antd';

/**
 * 发送Embedding嵌入请求到模型API
 * @param {Object} modelInfo - 模型信息对象，包含accessUrl、accessKey、modelName等
 * @param {string|Array} input - 输入文本或文本数组
 * @param {Function} setTestOutput - 设置测试输出的回调函数
 * @returns {Promise<Object>} - 嵌入结果
 */
export const sendEmbeddingRequest = async (modelInfo, input, setTestOutput) => {
  const { accessUrl, accessKey, modelName } = modelInfo;
  
  setTestOutput(`正在连接Embedding API...\n\n`);

  try {
    // 构建请求体
    const requestBody = {
      model: modelName,
      input: input
    };

    const inputType = Array.isArray(input) ? 'array' : 'string';
    const inputLength = Array.isArray(input) ? input.length : input.length;
    
    setTestOutput(prev => prev + `发送嵌入请求...\n输入类型: ${inputType}\n输入长度: ${inputLength}\n\n`);

    // 发送请求到后端代理
    const response = await fetch('/api/proxy/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        accessUrl,
        accessKey,
        requestBody
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      let errorMessage = 'Embedding API调用失败';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
        
        // 如果有详细的错误信息，显示给用户
        if (errorJson.data) {
          console.error('API错误详情:', errorJson.data);
        }
      } catch (e) {
        console.error('解析错误响应失败:', e);
      }
      
      setTestOutput(prev => prev + `❌ 错误: ${errorMessage}\n`);
      message.error(errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // 格式化输出结果
    let output = '✅ Embedding嵌入完成!\n\n';
    output += '📊 嵌入结果:\n';
    
    if (result.data && Array.isArray(result.data)) {
      output += `向量数量: ${result.data.length}\n`;
      
      result.data.forEach((item, index) => {
        if (item.embedding && Array.isArray(item.embedding)) {
          output += `${index + 1}. 向量维度: ${item.embedding.length}\n`;
          output += `   向量前5维: [${item.embedding.slice(0, 5).map(v => v.toFixed(6)).join(', ')}...]\n`;
          
          // 显示输入文本（如果是数组）
          if (Array.isArray(input) && input[index]) {
            const inputText = input[index].substring(0, 50);
            output += `   输入文本: "${inputText}${input[index].length > 50 ? '...' : ''}"\n`;
          }
          output += '\n';
        }
      });
      
      // 显示使用统计
      if (result.usage) {
        output += '📈 使用统计:\n';
        output += `   提示词令牌: ${result.usage.prompt_tokens || 'N/A'}\n`;
        output += `   总令牌数: ${result.usage.total_tokens || 'N/A'}\n\n`;
      }
    } else {
      output += JSON.stringify(result, null, 2);
    }
    
    setTestOutput(prev => prev + output);
    message.success('Embedding嵌入完成!');
    
    return result;
    
  } catch (error) {
    console.error('Embedding请求错误:', error);
    
    const errorMessage = error.message || 'Embedding请求失败';
    setTestOutput(prev => prev + `❌ 错误: ${errorMessage}\n`);
    message.error(errorMessage);
    
    throw error;
  }
};

/**
 * 验证Embedding请求参数
 * @param {string|Array} input - 输入文本或文本数组
 * @returns {Object} - 验证结果
 */
export const validateEmbeddingParams = (input) => {
  const errors = [];
  
  if (!input) {
    errors.push('输入内容不能为空');
  } else if (Array.isArray(input)) {
    if (input.length === 0) {
      errors.push('输入数组不能为空');
    } else if (input.length > 100) {
      errors.push('输入数组长度不能超过100个元素');
    } else {
      // 检查数组中的每个元素
      for (let i = 0; i < input.length; i++) {
        if (typeof input[i] !== 'string' || input[i].trim() === '') {
          errors.push(`第${i + 1}个输入项必须是非空字符串`);
          break;
        }
      }
    }
  } else if (typeof input !== 'string') {
    errors.push('输入必须是字符串或字符串数组');
  } else if (input.trim() === '') {
    errors.push('输入文本不能为空');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 处理Embedding测试的主函数
 * @param {Object} modelInfo - 模型信息
 * @param {string|Array} input - 输入文本或文本数组
 * @param {Function} setTestOutput - 设置测试输出的回调函数
 * @param {Function} setIsLoading - 设置加载状态的回调函数
 */
export const handleEmbeddingTest = async (modelInfo, input, setTestOutput, setIsLoading) => {
  if (setIsLoading) setIsLoading(true);
  
  try {
    // 验证参数
    const validation = validateEmbeddingParams(input);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      setTestOutput(`❌ 参数验证失败: ${errorMessage}`);
      message.error(errorMessage);
      return;
    }
    
    // 发送请求
    const result = await sendEmbeddingRequest(modelInfo, input, setTestOutput);
    return result;
    
  } catch (error) {
    console.error('Embedding测试失败:', error);
  } finally {
    if (setIsLoading) setIsLoading(false);
  }
};