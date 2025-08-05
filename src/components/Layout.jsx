import React from 'react';
import { Layout as AntLayout, Menu, Dropdown, Avatar, Space, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Content } = AntLayout;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const menuItems = [
    {
      key: '/',
      label: '首页'
    },
    {
      key: '/models',
      label: '模型库'
    },
    {
      key: '/datasets',
      label: '数据集库'
    },
    {
      key: '/flows',
      label: 'Flow库'
    },
    {
      key: '/agents',
      label: 'Agent库'
    },
    {
      key: '/leaderboards',
      label: '榜单库'
    }
  ];

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserRoleText = (role) => {
    switch (role) {
      case 'admin': return '管理员';
      case 'developer': return '研发';
      case 'guest': return '游客';
      default: return '游客';
    }
  };

  const userMenu = isAuthenticated() ? (
    <Menu
      items={[
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: (
            <div>
              <div>{user?.username}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {getUserRoleText(user?.role)}
              </div>
            </div>
          ),
          disabled: true
        },
        {
          type: 'divider'
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: '退出登录',
          onClick: handleLogout
        }
      ]}
    />
  ) : null;

  return (
    <AntLayout style={{ minHeight: '100vh', width: '100%' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: '#001529',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            color: 'white', 
            fontSize: '20px', 
            fontWeight: 'bold', 
            marginRight: '40px'
          }}>
            AI能力测评平台
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ 
              flex: 1, 
              backgroundColor: 'transparent',
              borderBottom: 'none'
            }}
          />
        </div>
        
        <div>
          {isAuthenticated() ? (
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer', color: 'white' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.username}</span>
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Button 
                type="text" 
                style={{ color: 'white' }}
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
              >
                登录
              </Button>
              <Button 
                type="primary"
                onClick={() => navigate('/register')}
              >
                注册
              </Button>
            </Space>
          )}
        </div>
      </Header>
      
      <Content style={{ padding: '16px', backgroundColor: '#f0f2f5', width: '100%' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)',
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto'
        }}>
          <Outlet />
        </div>
      </Content>
    </AntLayout>
  );
};

export default Layout;