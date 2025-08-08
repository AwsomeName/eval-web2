# SiliconFlow 图像生成模型集成指南

本文档介绍如何在系统中配置和使用SiliconFlow的图像生成模型。

## 🚀 快速开始

### 1. 获取API密钥

1. 访问 [SiliconFlow官网](https://siliconflow.cn)
2. 注册账号并获取API密钥
3. 记录您的API密钥，格式类似：`sk-xxxxxxxxxxxxxx`

### 2. 配置模型

在模型管理页面添加新的图像生成模型：

- **模型名称**: 自定义名称，如 "Kolors图像生成"
- **模型类型**: 选择 "图像生成模型"
- **API URL**: `https://api.siliconflow.cn/v1`
- **API Key**: 您的SiliconFlow API密钥
- **模型名称**: `Kwai-Kolors/Kolors` (或其他支持的模型)

### 3. 支持的模型

SiliconFlow支持多种图像生成模型：

- `Kwai-Kolors/Kolors` - 快手可图大模型
- `stabilityai/stable-diffusion-xl-base-1.0` - Stable Diffusion XL
- `stabilityai/stable-diffusion-2-1` - Stable Diffusion 2.1

## 📋 API参数说明

### 请求参数

```json
{
  "model": "Kwai-Kolors/Kolors",
  "prompt": "图像描述文本",
  "image_size": "1024x1024",
  "batch_size": 1,
  "num_inference_steps": 20,
  "guidance_scale": 7.5
}
```

### 参数详解

- **model**: 模型名称
- **prompt**: 图像生成的提示词（英文效果更好）
- **image_size**: 图像尺寸，支持：
  - `512x512`
  - `768x768` 
  - `1024x1024`
  - `1024x768`
  - `768x1024`
- **batch_size**: 批次大小，通常为1
- **num_inference_steps**: 推理步数，影响生成质量（10-50）
- **guidance_scale**: 引导强度，控制与提示词的相关性（1.0-20.0）

## 🎨 使用示例

### 基础用法

在模型测试页面输入提示词：

```
an island near sea, with seagulls, moon shining over the sea, light house, boats in the background, fish flying over the sea
```

### 高质量提示词技巧

1. **详细描述**: 包含主体、环境、风格、光照等
2. **使用英文**: 英文提示词通常效果更好
3. **添加质量词**: 如 "high quality", "detailed", "masterpiece"
4. **指定风格**: 如 "oil painting", "digital art", "photorealistic"

### 示例提示词

```
# 风景画
a beautiful sunset over mountains, golden hour lighting, detailed landscape, high quality, digital art

# 人物肖像
a portrait of a young woman, soft lighting, detailed face, photorealistic, high quality

# 抽象艺术
abstract geometric shapes, vibrant colors, modern art style, high contrast
```

## 🔧 技术实现

### API调用流程

1. 构建请求参数
2. 发送POST请求到 `/v1/images/generations`
3. 解析响应获取图像数据
4. 显示生成的图像

### 响应格式

```json
{
  "images": [
    {
      "url": "https://example.com/image.png",
      "b64_json": "base64编码的图像数据"
    }
  ]
}
```

## 🐛 常见问题

### 1. API调用失败

**可能原因**:
- API密钥无效或过期
- 网络连接问题
- 请求参数格式错误

**解决方案**:
- 检查API密钥是否正确
- 确认网络连接正常
- 验证请求参数格式

### 2. 生成图像质量不佳

**可能原因**:
- 提示词不够详细
- 推理步数过低
- 引导强度不合适

**解决方案**:
- 优化提示词描述
- 增加推理步数（20-50）
- 调整引导强度（7.0-15.0）

### 3. 生成速度慢

**可能原因**:
- 推理步数过高
- 图像尺寸过大
- 服务器负载高

**解决方案**:
- 降低推理步数
- 使用较小的图像尺寸
- 避免高峰时段使用

## 📚 更多资源

- [SiliconFlow官方文档](https://docs.siliconflow.cn)
- [API参考文档](https://docs.siliconflow.cn/api-reference)
- [模型列表](https://docs.siliconflow.cn/models)

## 🔄 更新日志

- **v1.0.0**: 初始版本，支持基础图像生成功能
- **v1.1.0**: 添加多种图像尺寸支持
- **v1.2.0**: 优化错误处理和响应解析