# AI模型能力测评平台

专业的AI模型能力测评与榜单定制平台，为AI研发提供全方位的评估工具和数据支持。

## 功能特点

- **多模态模型支持**：支持文本、语音、图像、多模态等各类AI模型的接入和测试
- **灵活榜单定制**：自定义评测指标，生成专业的能力评估榜单和可视化报告
- **数据安全管理**：企业级数据安全保障，支持私有化部署和权限精细控制

## 技术栈

### 前端

- React 19
- Vite 7
- Ant Design 5
- React Router 7
- Recharts 3

### 后端

- Node.js
- Express
- PostgreSQL
- JWT认证

## 快速开始

### 环境要求

- Node.js (v18+)
- PostgreSQL (v14+)

### 安装依赖

在项目根目录和backend目录分别执行：

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend
npm install
```

### 配置数据库

1. 确保PostgreSQL服务已启动
2. 修改 `backend/config/database.js` 中的数据库连接配置

### 一键启动

可以使用提供的启动脚本同时启动前端和后端服务：

```bash
# 从项目根目录执行
./start.sh
```

启动脚本会自动：
1. 检查数据库连接并进行必要的初始化
2. 自动创建数据库表结构（如果不存在）
3. 添加示例数据（首次运行时）
4. 启动后端API服务（端口3001）
5. 启动前端开发服务器（端口5174）
6. 监控各服务运行状态，按Ctrl+C可一键停止所有服务

如果脚本运行时遇到权限问题，请先赋予执行权限：
```bash
chmod +x start.sh
```

### 手动启动

也可以分别启动前端和后端服务：

```bash
# 初始化数据库（仅首次运行需要，在backend目录）
cd backend
node init-db.js

# 可选：添加示例数据
node seed-data.js

# 启动后端（在backend目录）
npm run dev

# 启动前端（在项目根目录）
cd ..
npm run dev
```

## 访问应用

- 前端页面：http://localhost:5174
- API接口：http://localhost:3001

## 接口说明

- `/api/health` - 健康检查接口
- `/api/stats` - 获取系统资源统计数据
- `/api/auth/*` - 用户认证相关接口
- `/api/models/*` - 模型管理相关接口
- `/api/datasets/*` - 数据集管理相关接口
- `/api/flows/*` - 评测流程相关接口
- `/api/agents/*` - 智能代理相关接口
- `/api/leaderboards/*` - 榜单管理相关接口
