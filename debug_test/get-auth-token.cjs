const axios = require('axios');

// 配置信息
const config = {
  baseUrl: 'http://localhost:3001',
  testUser: {
    username: 'tts_test_user',
    password: 'test123456',
    role: 'developer'
  }
};

async function registerUser() {
  console.log('=== 注册测试用户 ===\n');
  
  try {
    const response = await axios({
      method: 'POST',
      url: `${config.baseUrl}/api/auth/register`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: config.testUser
    });
    
    console.log('✅ 用户注册成功!');
    console.log('用户信息:', response.data.user);
    console.log('JWT令牌:', response.data.token);
    
    return response.data.token;
    
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.error === '用户名已存在') {
      console.log('ℹ️ 用户已存在，尝试登录...');
      return await loginUser();
    } else {
      console.error('❌ 注册失败:', error.response?.data || error.message);
      throw error;
    }
  }
}

async function loginUser() {
  console.log('=== 登录用户 ===\n');
  
  try {
    const response = await axios({
      method: 'POST',
      url: `${config.baseUrl}/api/auth/login`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        username: config.testUser.username,
        password: config.testUser.password
      }
    });
    
    console.log('✅ 登录成功!');
    console.log('用户信息:', response.data.user);
    console.log('JWT令牌:', response.data.token);
    
    return response.data.token;
    
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    throw error;
  }
}

async function verifyToken(token) {
  console.log('\n=== 验证令牌 ===\n');
  
  try {
    const response = await axios({
      method: 'GET',
      url: `${config.baseUrl}/api/auth/verify`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 令牌验证成功!');
    console.log('用户信息:', response.data.user);
    
    return true;
    
  } catch (error) {
    console.error('❌ 令牌验证失败:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('JWT令牌获取工具\n');
  
  try {
    // 尝试注册或登录用户
    const token = await registerUser();
    
    // 验证令牌
    const isValid = await verifyToken(token);
    
    if (isValid) {
      console.log('\n=== 令牌信息 ===');
      console.log('完整令牌:', token);
      console.log('\n💡 使用方法:');
      console.log('在请求头中添加: Authorization: Bearer ' + token);
      console.log('\n📋 复制以下令牌用于测试:');
      console.log(token);
    }
    
  } catch (error) {
    console.error('\n❌ 获取令牌失败:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);