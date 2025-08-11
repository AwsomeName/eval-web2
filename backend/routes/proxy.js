const express = require('express');

// 导入各个功能模块
const chatRouter = require('./proxy/chat');
const audioRouter = require('./proxy/audio');
const mediaRouter = require('./proxy/media');
const rerankRouter = require('./proxy/rerank');
const embeddingRouter = require('./proxy/embedding');

const router = express.Router();

// 挂载各个功能模块到对应的路径
// 聊天相关路由
router.use('/chat', chatRouter);
router.use('/model', chatRouter);

// 音频相关路由
router.use('/audio', audioRouter);
router.use('/tts', audioRouter);

// 媒体相关路由（图像和视频）
router.use('/', mediaRouter);

// 重排序路由
router.use('/rerank', rerankRouter);

// 嵌入模型路由
router.use('/embeddings', embeddingRouter);

module.exports = router;