import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      message.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>AI能力测评平台</Title>
          <Title level={4} type="secondary">用户登录</Title>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { 
                required: true, 
                message: '请输入用户名！' 
              },
              {
                min: 3,
                message: '用户名至少3个字符！'
              }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { 
                required: true, 
                message: '请输入密码！' 
              },
              {
                min: 6,
                message: '密码至少6个字符！'
              }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              style={{ marginBottom: 16 }}
            >
              登录
            </Button>
            
            <div style={{ textAlign: 'center' }}>
              还没有账户？ <Link to="/register">立即注册</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;