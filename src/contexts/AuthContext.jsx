import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';
import { authAPI } from '../utils/api'; // 导入api.js中的authAPI

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
      // 使用authAPI验证token有效性
      authAPI.verify()
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
      // 使用authAPI进行登录
      const data = await authAPI.login({ username, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      message.success('登录成功！');
      return { success: true };
    } catch (error) {
      message.error(error.message || '登录失败');
      return { success: false, error: error.message };
    }
  };

  const register = async (username, password, role = 'developer') => {
    try {
      // 使用authAPI进行注册
      await authAPI.register({ username, password, role });
      message.success('注册成功！请登录');
      return { success: true };
    } catch (error) {
      message.error(error.message || '注册失败');
      return { success: false, error: error.message };
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