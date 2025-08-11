import { message } from 'antd';

/**
 * 发送Rerank重排序请求到模型API
 * @param {Object} modelInfo - 模型信息对象，包含accessUrl、accessKey、modelName等
 * @param {string} query - 查询文本
 * @param {Array} documents - 文档数组
 * @param {Function} setTestOutput - 设置测试输出的回调函数
 * @returns {Promise<Object>} - 重排序结果
 */
export const sendRerankRequest = async (modelInfo, query, documents, setTestOutput) => {
  const { accessUrl, accessKey, modelName } = modelInfo;
  
  setTestOutput(`正在连接Rerank API...\n\n`);

  try {
    // 构建请求体
    const requestBody = {
      model: modelName,
      query: query,
      documents: documents
    };

    setTestOutput(prev => prev + `发送重排序请求...\n查询: ${query}\n文档数量: ${documents.length}\n\n`);

    // 发送请求到后端代理
    const response = await fetch('/api/proxy/rerank', {
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
      
      let errorMessage = 'Rerank API调用失败';
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
    let output = '✅ Rerank重排序完成!\n\n';
    output += '📊 重排序结果:\n';
    
    if (result.results && Array.isArray(result.results)) {
      result.results.forEach((item, index) => {
        output += `${index + 1}. 文档索引: ${item.index}, 相关性分数: ${item.relevance_score?.toFixed(4) || 'N/A'}\n`;
        output += `   文档内容: ${documents[item.index]?.substring(0, 100)}${documents[item.index]?.length > 100 ? '...' : ''}\n\n`;
      });
    } else {
      output += JSON.stringify(result, null, 2);
    }
    
    setTestOutput(prev => prev + output);
    message.success('Rerank重排序完成!');
    
    return result;
    
  } catch (error) {
    console.error('Rerank请求错误:', error);
    
    const errorMessage = error.message || 'Rerank请求失败';
    setTestOutput(prev => prev + `❌ 错误: ${errorMessage}\n`);
    message.error(errorMessage);
    
    throw error;
  }
};

/**
 * 验证Rerank请求参数
 * @param {string} query - 查询文本
 * @param {Array} documents - 文档数组
 * @returns {Object} - 验证结果
 */
export const validateRerankParams = (query, documents) => {
  const errors = [];
  
  if (!query || query.trim().length === 0) {
    errors.push('查询文本不能为空');
  }
  
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    errors.push('文档列表不能为空');
  } else {
    // 检查文档内容
    const emptyDocs = documents.filter(doc => !doc || doc.trim().length === 0);
    if (emptyDocs.length > 0) {
      errors.push('文档列表中包含空文档');
    }
    
    if (documents.length > 100) {
      errors.push('文档数量不能超过100个');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 处理Rerank测试
 * @param {Object} modelInfo - 模型信息
 * @param {string} query - 查询文本
 * @param {Array} documents - 文档数组
 * @param {Function} setTestOutput - 设置输出的函数
 * @param {Function} setIsLoading - 设置加载状态的函数
 */
export const handleRerankTest = async (modelInfo, query, documents, setTestOutput, setIsLoading) => {
  // 验证参数
  const validation = validateRerankParams(query, documents);
  if (!validation.isValid) {
    const errorMessage = validation.errors.join(', ');
    message.error(errorMessage);
    setTestOutput(`❌ 参数验证失败: ${errorMessage}\n`);
    return;
  }
  
  setIsLoading(true);
  
  try {
    await sendRerankRequest(modelInfo, query, documents, setTestOutput);
  } catch (error) {
    console.error('Rerank测试失败:', error);
  } finally {
    setIsLoading(false);
  }
};