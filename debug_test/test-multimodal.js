import fs from 'fs';
import path from 'path';
import axios from 'axios';

// 模型参数
const MODEL_NAME = 'Qwen/Qwen2-VL-72B-Instruct';
const REMOTE_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const API_KEY = 'sk-njljfceociowdvxvmnbcybcyedeppdwgwkgwmwhgttbpdmot';
const IMAGE_PATH = '/home/lc/hehua.png';
const QUERY = '这是什么花';

// 本地代理服务器信息
const LOCAL_PROXY_URL = 'http://localhost:3001/api/proxy/model/test';
const LOGIN_URL = 'http://localhost:3001/api/auth/login';
// 登录凭据 - 请替换为实际的用户名和密码
const USERNAME = 'test';
const PASSWORD = 'Abc!2345';

// 获取JWT令牌
async function getAuthToken() {
  try {
    console.log('正在获取认证令牌...');
    const response = await axios.post(LOGIN_URL, {
      username: USERNAME,
      password: PASSWORD
    });
    
    if (response.data.token) {
      console.log('获取令牌成功');
      return response.data.token;
    } else {
      throw new Error('登录响应中未找到令牌');
    }
  } catch (error) {
    console.error('获取令牌失败:', error.message);
    throw error;
  }
}

// 读取图片并转换为base64
async function readImageAsBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Data = imageBuffer.toString('base64');
    const fileExtension = path.extname(imagePath).substring(1);
    const mimeType = `image/${fileExtension}`;
    return { base64Data, mimeType };
  } catch (error) {
    console.error('读取图片失败:', error);
    throw error;
  }
}

// 构建多模态请求
async function buildMultimodalRequest() {
  const { base64Data, mimeType } = await readImageAsBase64(IMAGE_PATH);
  
  const imageContent = {
    type: "image",
    data: base64Data,
    format: mimeType.split('/')[1]
  };
  
  const messages = [
    {
      role: 'user',
      content: QUERY,
      images: [imageContent]
    }
  ];
  
  return {
    modelInfo: {
      accessUrl: REMOTE_API_URL,
      accessKey: API_KEY,
      modelName: MODEL_NAME
    },
    messages: messages,
    options: {
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    }
  };
}

// 发送请求到本地代理服务
async function testMultimodalAPI() {
  try {
    // 获取认证令牌
    const authToken = await getAuthToken();
    
    console.log('正在构建多模态请求...');
    const requestBody = await buildMultimodalRequest();
    
    console.log('发送请求到本地代理服务...');
    const response = await axios({
      method: 'post',
      url: LOCAL_PROXY_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: requestBody
    });
    
    console.log('代理服务响应:');
    console.log('完整响应:', JSON.stringify(response.data, null, 2));
    
    if (response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      console.log('模型响应内容:', content);
      return content;
    } else {
      console.log('未获取到有效响应内容');
    }
  } catch (error) {
    console.error('请求失败:', error.message);
    if (error.response) {
      console.error('错误详情:', error.response.data);
      console.error('状态码:', error.response.status);
    }
  }
}

// 执行测试
testMultimodalAPI();