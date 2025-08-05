import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await register(values.username, values.password, values.role);
      if (result.success) {
        navigate('/login');
      }
    } catch (error) {
      message.error('注册失败，请稍后重试');
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
          <Title level={4} type="secondary">用户注册</Title>
        </div>
        
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          initialValues={{ role: 'developer' }}
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
                max: 20,
                message: '用户名长度应在3-20个字符之间！'
              },
              {
                pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
                message: '用户名只能包含字母、数字、下划线和中文！'
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
                max: 20,
                message: '密码长度应在6-20个字符之间！'
              }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              {
                required: true,
                message: '请确认密码！'
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致！'));
                },
              })
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="确认密码" 
            />
          </Form.Item>

          <Form.Item
            name="role"
            rules={[
              { 
                required: true, 
                message: '请选择用户角色！' 
              }
            ]}
          >
            <Select 
              prefix={<TeamOutlined />} 
              placeholder="选择用户角色"
            >
              <Option value="developer">研发人员</Option>
              <Option value="guest">普通用户</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              style={{ marginBottom: 16 }}
            >
              注册
            </Button>
            
            <div style={{ textAlign: 'center' }}>
              已有账户？ <Link to="/login">立即登录</Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Register;