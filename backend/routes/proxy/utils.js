const axios = require('axios');

/**
 * 清理URL，去除可能的空格和特殊字符
 * @param {string} url - 原始URL
 * @returns {string} - 清理后的URL
 */
function cleanUrl(url) {
  if (!url) return url;
  return url.trim().replace(/[`'"\s]/g, '');
}

/**
 * 清理API Key，去除可能的空格、换行符等特殊字符
 * @param {string} key - 原始API Key
 * @returns {string} - 清理后的API Key
 */
function cleanApiKey(key) {
  if (!key) return key;
  return key.trim().replace(/[\r\n\t\s]/g, '');
}

/**
 * 生成掩码API Key用于日志记录
 * @param {string} key - API Key
 * @returns {string} - 掩码后的API Key
 */
function maskApiKey(key) {
  if (!key || key.length < 8) return '****';
  return key.substring(0, 4) + '****' + key.slice(-4);
}

/**
 * 验证URL格式
 * @param {string} url - 要验证的URL
 * @returns {boolean} - 是否为有效URL
 */
function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 处理API错误响应
 * @param {Error} error - 错误对象
 * @param {Object} res - Express响应对象
 * @param {string} operation - 操作名称
 */
function handleApiError(error, res, operation) {
  console.error(`${operation}请求错误:`, error);
  
  if (!res.headersSent) {
    if (error.response) {
      try {
        const errorResponse = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
        
        return res.status(error.response.status).json(errorResponse);
      } catch (serializationError) {
        console.error('错误序列化失败:', serializationError);
        return res.status(500).json({ 
          error: `${operation}失败`, 
          message: error.message,
          responseStatus: error.response ? error.response.status : undefined,
          responseStatusText: error.response ? error.response.statusText : undefined
        });
      }
    }
    
    res.status(500).json({ error: `${operation}失败`, message: error.message });
  }
}

/**
 * 处理流式响应错误
 * @param {Error} error - 错误对象
 * @param {Object} res - Express响应对象
 * @param {string} operation - 操作名称
 */
function handleStreamError(error, res, operation) {
  console.error(`${operation}流式响应错误:`, error);
  
  if (!res.headersSent) {
    try {
      const status = error.response ? error.response.status : 500;
      const message = error.message || `${operation}流式响应错误`;
      
      let responseData = null;
      if (error.response && error.response.data) {
        if (Buffer.isBuffer(error.response.data)) {
          responseData = error.response.data.toString('utf8');
        } else if (typeof error.response.data === 'string') {
          responseData = error.response.data;
        } else {
          responseData = JSON.stringify(error.response.data);
        }
        console.error('API错误响应数据:', responseData);
      }

      const errorResponse = {
        error: `${operation}代理请求失败`,
        status: status,
        message: message
      };

      if (responseData) {
        errorResponse.responseData = responseData;
      }

      res.status(status).json(errorResponse);
    } catch (e) {
      console.error('构建错误响应失败:', e);
      res.status(500).json({
        error: `${operation}代理请求失败`,
        message: '无法构建错误响应',
        status: 500
      });
    }
  }
}

/**
 * 设置流式响应头
 * @param {Object} res - Express响应对象
 */
function setStreamHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

/**
 * 序列化错误对象，处理循环引用和二进制数据
 * @param {any} obj - 要序列化的对象
 * @param {WeakSet} seen - 已访问对象集合
 * @returns {any} - 序列化后的对象
 */
function serializeError(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') {
    if (Buffer.isBuffer(obj)) {
      return obj.toString('utf8');
    }
    return obj;
  }
  if (seen.has(obj)) {
    return '[Circular]';
  }
  seen.add(obj);
  const result = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = serializeError(obj[key], seen);
    }
  }
  seen.delete(obj);
  return result;
}

module.exports = {
  cleanUrl,
  cleanApiKey,
  maskApiKey,
  validateUrl,
  handleApiError,
  handleStreamError,
  setStreamHeaders,
  serializeError
};