# Proxy.js 调试指南

这个调试套件专门用于测试和调试 `/backend/routes/proxy.js` 文件中的API代理功能。

## 🗂️ 文件说明

### 核心文件
- **`routes/proxy.js`** - 原始的代理路由文件
- **`debug-proxy.js`** - 独立的调试服务器
- **`test-proxy-cases.js`** - 测试用例和测试函数
- **`PROXY_DEBUG_README.md`** - 本说明文档

## 🚀 快速开始

### 1. 启动调试服务
```bash
cd /home/lc/eval-web2/backend
node debug-proxy.js
```

服务将在 `http://localhost:3001` 启动

### 2. 运行测试
```bash
# 运行所有测试
node test-proxy-cases.js

# 运行特定测试
node test-proxy-cases.js health        # 健康检查
node test-proxy-cases.js chatCompletion # 聊天完成测试
node test-proxy-cases.js modelTest     # 模型测试
node test-proxy-cases.js errorCases    # 错误用例测试
```

## 📡 API 端点

### 基础端点
- `GET /` - 服务信息和使用说明
- `GET /api/proxy/health` - 健康检查

### 主要功能端点
- `POST /api/proxy/chat/completions` - 聊天完成API代理
- `POST /api/proxy/model/test` - 模型测试

## 🧪 测试用例

### 正常场景
1. **聊天完成请求** - 测试基本的API代理功能
2. **流式响应** - 测试Server-Sent Events流式传输
3. **模型测试** - 测试模型信息验证和请求构建

### 错误场景
1. **URL格式错误** - 测试URL验证
2. **缺少参数** - 测试参数验证
3. **特殊字符处理** - 测试URL清理功能

## 🔍 调试功能

### 详细日志
调试服务提供详细的控制台日志：
- 📝 请求参数详情
- 🔍 参数验证状态
- 🧹 URL清理过程
- 📊 API调用详情
- ⚡ 响应状态和时间
- ❌ 错误详情和堆栈

### 安全特性
- 🔐 API密钥部分隐藏显示
- 🛡️ 认证检查跳过（调试模式）
- 🚫 敏感信息保护

## 📋 使用示例

### 测试聊天完成API
```bash
curl -X POST http://localhost:3001/api/proxy/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "accessUrl": "https://api.openai.com/v1/chat/completions",
    "accessKey": "your-api-key",
    "requestBody": {
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": "Hello"}],
      "stream": false
    }
  }'
```

### 测试模型功能
```bash
curl -X POST http://localhost:3001/api/proxy/model/test \
  -H "Content-Type: application/json" \
  -d '{
    "modelInfo": {
      "accessUrl": "https://api.openai.com/v1/chat/completions",
      "accessKey": "your-api-key",
      "modelName": "gpt-3.5-turbo"
    },
    "messages": [{"role": "user", "content": "Test message"}],
    "options": {
      "stream": true,
      "temperature": 0.7,
      "max_tokens": 100
    }
  }'
```

## 🐛 常见问题和解决方案

### 1. 连接超时
**问题**: 请求外部API时超时
**解决**: 
- 检查网络连接
- 确认API URL是否正确
- 验证API密钥是否有效

### 2. URL格式错误
**问题**: URL包含特殊字符或格式不正确
**解决**:
- 调试服务会自动清理URL中的特殊字符
- 检查控制台中的URL清理前后对比

### 3. 认证失败
**问题**: API密钥无效或权限不足
**解决**:
- 确认API密钥格式正确
- 检查API密钥是否有对应模型的访问权限

### 4. 流式响应问题
**问题**: 流式响应中断或格式错误
**解决**:
- 检查目标API是否支持流式响应
- 确认Content-Type设置正确

## 📊 性能监控

调试服务会记录：
- 📈 请求响应时间
- 📏 响应数据大小
- 🔢 HTTP状态码
- 🌊 流式响应状态

## 🔧 高级调试

### 修改调试端口
```bash
DEBUG_PORT=3002 node debug-proxy.js
```

### 启用更详细的日志
编辑 `debug-proxy.js`，在需要的位置添加更多 `console.log` 语句。

### 自定义测试用例
编辑 `test-proxy-cases.js` 中的 `testCases` 对象，添加你的测试场景。

## 🛠️ 代码结构分析

### proxy.js 主要功能
1. **URL清理** - 去除空格和特殊字符
2. **参数验证** - 检查必要字段
3. **流式处理** - 支持Server-Sent Events
4. **错误处理** - 完善的错误响应机制
5. **安全性** - 敏感信息保护

### 关键代码段
```javascript
// URL清理逻辑
if (accessUrl) {
  accessUrl = accessUrl.trim().replace(/[`'"\s]/g, '');
}

// 流式响应处理
if (requestBody.stream) {
  response.data.pipe(res);
}

// 错误序列化处理
const sanitizedError = {
  status: error.response.status,
  statusText: error.response.statusText,
  headers: error.response.headers ? JSON.parse(JSON.stringify(error.response.headers)) : undefined
};
```

## 🎯 调试检查清单

- [ ] 服务成功启动在指定端口
- [ ] 健康检查通过
- [ ] 基本聊天完成请求工作正常
- [ ] 流式响应正确处理
- [ ] 错误用例返回适当的错误码
- [ ] URL清理功能正常
- [ ] API密钥正确隐藏显示
- [ ] 模型测试功能正常

## 📞 支持

如果遇到问题：
1. 检查控制台日志中的详细错误信息
2. 确认网络连接和API配置
3. 运行完整的测试套件确认问题范围
4. 查看本文档的常见问题部分

---

**调试愉快！** 🚀