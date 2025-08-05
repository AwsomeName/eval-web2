import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Button } from 'antd';
import { 
  RobotOutlined, 
  DatabaseOutlined, 
  NodeIndexOutlined, 
  TeamOutlined, 
  TrophyOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    models: 0,
    datasets: 0,
    flows: 0,
    agents: 0,
    leaderboards: 0
  });

  useEffect(() => {
    // 获取统计数据
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const resourceCards = [
    {
      title: '模型库',
      description: '管理和测试各种AI模型',
      icon: <RobotOutlined />,
      count: stats.models,
      path: '/models',
      color: '#1890ff'
    },
    {
      title: '数据集库',
      description: '存储和管理测评数据集',
      icon: <DatabaseOutlined />,
      count: stats.datasets,
      path: '/datasets',
      color: '#52c41a'
    },
    {
      title: 'Flow库',
      description: '工作流和聊天流程管理',
      icon: <NodeIndexOutlined />,
      count: stats.flows,
      path: '/flows',
      color: '#722ed1'
    },
    {
      title: 'Agent库',
      description: '智能代理管理平台',
      icon: <TeamOutlined />,
      count: stats.agents,
      path: '/agents',
      color: '#fa8c16'
    },
    {
      title: '榜单库',
      description: '能力测评榜单定制',
      icon: <TrophyOutlined />,
      count: stats.leaderboards,
      path: '/leaderboards',
      color: '#eb2f96'
    }
  ];

  return (
    <div>
      {/* 欢迎区域 */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '60px 40px',
        borderRadius: '12px',
        marginBottom: '32px',
        color: 'white',
        textAlign: 'center'
      }}>
        <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
          AI能力测评平台
        </Title>
        <Paragraph style={{ 
          fontSize: '18px', 
          color: 'rgba(255,255,255,0.9)',
          maxWidth: '800px',
          margin: '0 auto 24px',
          lineHeight: '1.6'
        }}>
          专业的AI模型能力测评与榜单定制平台，为AI研发提供全方位的评估工具和数据支持
        </Paragraph>
        
        {isAuthenticated() ? (
          <div>
            <Title level={4} style={{ color: 'white', marginBottom: '8px' }}>
              欢迎回来, {user?.username}!
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
              您的角色：{user?.role === 'admin' ? '管理员' : user?.role === 'developer' ? '研发人员' : '普通用户'}
            </Paragraph>
          </div>
        ) : (
          <Space>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => navigate('/login')}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'white' }}
            >
              立即登录
            </Button>
            <Button 
              size="large" 
              onClick={() => navigate('/register')}
              style={{ 
                backgroundColor: 'white', 
                color: '#667eea',
                borderColor: 'white'
              }}
            >
              注册账户
            </Button>
          </Space>
        )}
      </div>

      {/* 资源库卡片 */}
      <Row gutter={[16, 16]} className="resource-cards">
        {resourceCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4.8} xxl={4} key={index}>
            <Card
              hoverable
              style={{ 
                height: '200px',
                borderRadius: '12px',
                border: `2px solid ${card.color}20`,
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ 
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onClick={() => navigate(card.path)}
            >
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    fontSize: '24px', 
                    color: card.color,
                    marginRight: '12px'
                  }}>
                    {card.icon}
                  </div>
                  <Title level={5} style={{ margin: 0 }}>
                    {card.title}
                  </Title>
                </div>
                <Paragraph 
                  type="secondary" 
                  style={{ 
                    fontSize: '13px',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                  }}
                >
                  {card.description}
                </Paragraph>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <Statistic 
                  value={card.count} 
                  valueStyle={{ 
                    fontSize: '20px', 
                    color: card.color,
                    fontWeight: 'bold'
                  }}
                  suffix="个"
                />
                <ArrowRightOutlined style={{ color: card.color }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 功能特性 */}
      <Row gutter={[16, 16]} style={{ marginTop: '32px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card 
            bordered={false}
            style={{ textAlign: 'center', height: '200px' }}
            bodyStyle={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <RobotOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
            <Title level={4}>多模态模型支持</Title>
            <Paragraph type="secondary">
              支持文本、语音、图像、多模态等各类AI模型的接入和测试
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card 
            bordered={false}
            style={{ textAlign: 'center', height: '200px' }}
            bodyStyle={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <TrophyOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
            <Title level={4}>灵活榜单定制</Title>
            <Paragraph type="secondary">
              自定义评测指标，生成专业的能力评估榜单和可视化报告
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card 
            bordered={false}
            style={{ textAlign: 'center', height: '200px' }}
            bodyStyle={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <DatabaseOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '16px' }} />
            <Title level={4}>数据安全管理</Title>
            <Paragraph type="secondary">
              企业级数据安全保障，支持私有化部署和权限精细控制
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;