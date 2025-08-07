import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Avatar, Space, Button, Typography } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  UserOutlined, 
  LogoutOutlined, 
  LoginOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
  HomeOutlined,
  DatabaseOutlined,
  ApiOutlined,
  AppstoreOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { modelsAPI } from '../utils/api';

const { Header, Content, Sider } = AntLayout;
const { Title, Text } = Typography;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [modelsByOrg, setModelsByOrg] = useState({});
  const [loading, setLoading] = useState(false);

  // 判断当前是否在模型页面
  const isModelPage = location.pathname.includes('/models');

  // 获取模型数据并按机构分组
  useEffect(() => {
    if (isModelPage) {
      fetchModels();
    }
  }, [isModelPage]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const data = await modelsAPI.getAll({ limit: 100 }); // 获取较多模型以确保包含所有机构
      const grouped = {};
      
      data.models.forEach(model => {
        // 这里使用 publisher 代替 organization
        const org = model.publisher || '未分类';
        if (!grouped[org]) {
          grouped[org] = [];
        }
        grouped[org].push(model);
      });
      
      setModelsByOrg(grouped);
    } catch (error) {
      console.error('获取模型列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      key: '/',
      label: '首页',
      icon: <HomeOutlined />
    },
    {
      key: '/models',
      label: '模型库',
      icon: <RobotOutlined />
    },
    {
      key: '/datasets',
      label: '数据集库',
      icon: <DatabaseOutlined />
    },
    {
      key: '/flows',
      label: 'Flow库',
      icon: <ApiOutlined />
    },
    {
      key: '/agents',
      label: 'Agent库',
      icon: <AppstoreOutlined />
    },
    {
      key: '/leaderboards',
      label: '榜单库',
      icon: <BarChartOutlined />
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

  // 生成侧边栏模型菜单项
  const getModelMenuItems = () => {
    return Object.entries(modelsByOrg).map(([org, models]) => ({
      key: `org-${org}`,
      label: org,
      icon: <RobotOutlined />,
      children: models.map(model => ({
        key: `/models/${model.id}`,
        label: model.name,
        onClick: () => navigate(`/models/${model.id}`)
      }))
    }));
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 只在模型页面显示侧边栏 */}
      {isModelPage && (
        <Sider 
          width={240} 
          collapsible 
          collapsed={collapsed} 
          onCollapse={value => setCollapsed(value)}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 999
          }}
        >
          <div style={{ 
            height: '64px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 16px',
            color: 'white',
            fontSize: collapsed ? '18px' : '16px',
            fontWeight: 'bold'
          }}>
            {!collapsed && <span>模型列表</span>}
            {collapsed && <RobotOutlined />}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={Object.keys(modelsByOrg).map(org => `org-${org}`)}
            items={getModelMenuItems()}
          />
        </Sider>
      )}

      <AntLayout style={{ 
        marginLeft: isModelPage ? (collapsed ? 80 : 240) : 0, 
        transition: 'margin-left 0.2s' 
      }}>
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
            {isModelPage && (
              <Button 
                type="text" 
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
                onClick={() => setCollapsed(!collapsed)}
                style={{ color: 'white', fontSize: '16px', marginRight: '16px' }}
              />
            )}
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
        
        <Content style={{ padding: '16px', backgroundColor: '#f0f2f5' }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            maxWidth: '1440px',
            margin: '0 auto'
          }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;