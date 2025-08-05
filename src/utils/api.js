import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    if (error.response) {
      const { status, data } = error.response;
      
      // 401 未授权 - 清除 token 并跳转登录
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('登录已过期，请重新登录'));
      }
      
      // 403 权限不足
      if (status === 403) {
        return Promise.reject(new Error('权限不足，无法执行此操作'));
      }
      
      // 500 服务器错误
      if (status >= 500) {
        return Promise.reject(new Error('服务器内部错误，请稍后重试'));
      }
      
      return Promise.reject(new Error(data.error || '请求失败'));
    }
    
    // 网络错误
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请检查网络连接'));
    }
    
    return Promise.reject(new Error('网络连接失败，请检查网络'));
  }
);

// 认证相关 API
export const authAPI = {
  // 注册
  register: (userData) => api.post('/api/auth/register', userData),
  
  // 登录
  login: (credentials) => api.post('/api/auth/login', credentials),
  
  // 验证 token
  verify: () => api.get('/api/auth/verify')
};

// 模型相关 API
export const modelsAPI = {
  // 获取模型列表
  getAll: (params = {}) => api.get('/api/models', { params }),
  
  // 获取模型详情
  getById: (id) => api.get(`/api/models/${id}`),
  
  // 创建模型
  create: (modelData) => api.post('/api/models', modelData),
  
  // 更新模型
  update: (id, modelData) => api.put(`/api/models/${id}`, modelData),
  
  // 删除模型
  delete: (id) => api.delete(`/api/models/${id}`)
};

// 数据集相关 API
export const datasetsAPI = {
  // 获取数据集列表
  getAll: (params = {}) => api.get('/api/datasets', { params }),
  
  // 获取数据集详情
  getById: (id) => api.get(`/api/datasets/${id}`),
  
  // 创建数据集
  create: (datasetData) => api.post('/api/datasets', datasetData),
  
  // 更新数据集
  update: (id, datasetData) => api.put(`/api/datasets/${id}`, datasetData),
  
  // 删除数据集
  delete: (id) => api.delete(`/api/datasets/${id}`),
  
  // 上传文件
  uploadFile: (formData) => api.post('/api/datasets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // 下载文件
  downloadFile: (id, filename) => api.get(`/api/datasets/${id}/download/${filename}`, {
    responseType: 'blob'
  })
};

// Flow 相关 API
export const flowsAPI = {
  // 获取 Flow 列表
  getAll: (params = {}) => api.get('/api/flows', { params }),
  
  // 获取 Flow 详情
  getById: (id) => api.get(`/api/flows/${id}`),
  
  // 创建 Flow
  create: (flowData) => api.post('/api/flows', flowData),
  
  // 更新 Flow
  update: (id, flowData) => api.put(`/api/flows/${id}`, flowData),
  
  // 删除 Flow
  delete: (id) => api.delete(`/api/flows/${id}`)
};

// Agent 相关 API
export const agentsAPI = {
  // 获取 Agent 列表
  getAll: (params = {}) => api.get('/api/agents', { params }),
  
  // 获取 Agent 详情
  getById: (id) => api.get(`/api/agents/${id}`),
  
  // 创建 Agent
  create: (agentData) => api.post('/api/agents', agentData),
  
  // 更新 Agent
  update: (id, agentData) => api.put(`/api/agents/${id}`, agentData),
  
  // 删除 Agent
  delete: (id) => api.delete(`/api/agents/${id}`)
};

// 榜单相关 API
export const leaderboardsAPI = {
  // 获取榜单列表
  getAll: (params = {}) => api.get('/api/leaderboards', { params }),
  
  // 获取榜单详情
  getById: (id) => api.get(`/api/leaderboards/${id}`),
  
  // 创建榜单
  create: (leaderboardData) => api.post('/api/leaderboards', leaderboardData),
  
  // 更新榜单
  update: (id, leaderboardData) => api.put(`/api/leaderboards/${id}`, leaderboardData),
  
  // 删除榜单
  delete: (id) => api.delete(`/api/leaderboards/${id}`),
  
  // 获取榜单结果
  getResults: (id) => api.get(`/api/leaderboards/${id}/results`),
  
  // 添加榜单结果
  addResult: (id, resultData) => api.post(`/api/leaderboards/${id}/results`, resultData),
  
  // 删除榜单结果
  deleteResult: (id, resultId) => api.delete(`/api/leaderboards/${id}/results/${resultId}`),
  
  // 导入榜单结果
  importResults: (id, formData) => api.post(`/api/leaderboards/${id}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // 导出榜单结果
  exportResults: (id) => api.get(`/api/leaderboards/${id}/export`, {
    responseType: 'blob'
  })
};

export default api;