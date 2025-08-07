import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Input, 
  Select, 
  Pagination, 
  Typography, 
  Tag, 
  Space,
  Modal,
  message
} from 'antd';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { 
  PlusOutlined, 
  SearchOutlined, 
  RobotOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  MessageOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { agentsAPI } from '../utils/api'; // 导入API封装

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const Agents = () => {
  const navigate = useNavigate();
  const { user, getToken, hasRole } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    agent_type: '',
    organization: ''
  });

  useEffect(() => {
    fetchAgents();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      };

      const data = await agentsAPI.getAll(params);
      setAgents(data.agents);
      setPagination(prev => ({
        ...prev,
        total: data.total
      }));
    } catch (error) {
      message.error(error.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确定删除这个Agent吗？',
      content: '删除后将无法恢复，请谨慎操作。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await agentsAPI.delete(id);
          message.success('删除成功');
          fetchAgents();
        } catch (error) {
          message.error(error.message || '删除失败');
        }
      }
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      'chatbot': 'blue',
      'assistant': 'green',
      'workflow': 'orange',
      'custom': 'purple'
    };
    return colors[type] || 'default';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'chatbot': <MessageOutlined />,
      'assistant': <RobotOutlined />,
      'workflow': <ToolOutlined />,
      'custom': <RobotOutlined />
    };
    return icons[type] || <RobotOutlined />;
  };

  const AgentCard = ({ agent }) => (
    <Card
      hoverable
      style={{ height: '300px' }}
      bodyStyle={{ 
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      actions={[
        agent.agent_url && (
          <Button 
            type="text" 
            icon={<LinkOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              window.open(agent.agent_url, '_blank');
            }}
          >
            访问Agent
          </Button>
        ),
        ...(hasRole(['admin', 'developer']) ? [
          <Button 
            type="text" 
            danger
            icon={<DeleteOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(agent.id);
            }}
          >
            删除
          </Button>
        ] : [])
      ].filter(Boolean)}
      onClick={() => navigate(`/agents/${agent.id}`)}
    >
      <div style={{ flex: 1 }}>
        {/* 头部：Agent名称、类型和图标平行布局 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {getTypeIcon(agent.agent_type)}
            <Title level={5} style={{ margin: 0, marginLeft: '8px' }} ellipsis>
              {agent.name}
            </Title>
            <Tag color={getTypeColor(agent.agent_type)} style={{ marginLeft: '8px' }}>
              {agent.agent_type === 'chatbot' ? '聊天机器人' : 
               agent.agent_type === 'assistant' ? '智能助手' :
               agent.agent_type === 'workflow' ? '工作流Agent' : '自定义Agent'}
            </Tag>
          </div>
          {hasRole(['admin', 'developer']) && (
            <Button 
              type="text" 
              danger
              size="small"
              icon={<DeleteOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(agent.id);
              }}
              style={{ flexShrink: 0 }}
            />
          )}
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <Space wrap>
            {agent.organization && (
              <Tag>
                {agent.organization}
              </Tag>
            )}
          </Space>
        </div>
        
        <div
          style={{ 
            fontSize: '13px',
            marginBottom: '12px',
            flex: 1,
            display: 'flex',  
            flexDirection: 'column',  
            overflow: 'auto'  
          }}
        >
          <MarkdownRenderer
            content={agent.description || '暂无描述'}
            isCard={true}
          />
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          {agent.agent_url && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <LinkOutlined style={{ fontSize: '12px', marginRight: '4px', color: '#999' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {agent.agent_url.length > 30 ? `${agent.agent_url.substring(0, 30)}...` : agent.agent_url}
              </Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div>
      {/* 页面头部 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Agent库</Title>
          <Text type="secondary">管理和浏览智能代理程序</Text>
        </div>
        {hasRole(['admin', 'developer']) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/agents/new')}
          >
            新增Agent
          </Button>
        )}
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索Agent名称或描述"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="选择Agent类型"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('agent_type', value)}
            >
              <Option value="chatbot">聊天机器人</Option>
              <Option value="assistant">智能助手</Option>
              <Option value="workflow">工作流Agent</Option>
              <Option value="custom">自定义Agent</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="按发布机构筛选"
              allowClear
              onChange={(e) => handleFilterChange('organization', e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      {/* Agent卡片网格 */}
      <Row gutter={[16, 16]}>
        {agents.map(agent => (
          <Col xs={24} sm={12} md={8} lg={6} key={agent.id}>
            <AgentCard agent={agent} />
          </Col>
        ))}
      </Row>

      {/* 空状态 */}
      {!loading && agents.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: '#999'
        }}>
          <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>暂无Agent</div>
          {hasRole(['admin', 'developer']) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/agents/new')}
            >
              添加第一个Agent
            </Button>
          )}
        </div>
      )}

      {/* 分页 */}
      {pagination.total > 0 && (
        <div style={{ textAlign: 'right', marginTop: '32px' }}>
          <Pagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pagination.pageSize}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
            onChange={(page, size) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: size
              }));
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Agents;