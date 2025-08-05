import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 检查本地存储的token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 验证token有效性
      fetch('http://localhost:3001/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Token无效');
        })
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        message.success('登录成功！');
        return { success: true };
      } else {
        message.error(data.error || '登录失败');
        return { success: false, error: data.error };
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      return { success: false, error: '网络错误' };
    }
  };

  const register = async (username, password, role = 'developer') => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('注册成功！请登录');
        return { success: true };
      } else {
        message.error(data.error || '注册失败');
        return { success: false, error: data.error };
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      return { success: false, error: '网络错误' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    message.success('已退出登录');
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    getToken,
    isAuthenticated,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};