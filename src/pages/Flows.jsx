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
import { 
  PlusOutlined, 
  SearchOutlined, 
  ApartmentOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const Flows = () => {
  const navigate = useNavigate();
  const { user, getToken, hasRole } = useAuth();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    flow_type: '',
    organization: ''
  });

  useEffect(() => {
    fetchFlows();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`http://localhost:3001/api/flows?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setFlows(data.flows);
        setPagination(prev => ({
          ...prev,
          total: data.total
        }));
      } else {
        message.error('获取Flow列表失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
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
      title: '确定删除这个Flow吗？',
      content: '删除后将无法恢复，请谨慎操作。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/flows/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${getToken()}`
            }
          });

          if (response.ok) {
            message.success('删除成功');
            fetchFlows();
          } else {
            const data = await response.json();
            message.error(data.error || '删除失败');
          }
        } catch (error) {
          message.error('网络错误，请稍后重试');
        }
      }
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      'workflow': 'blue',
      'chatflow': 'green'
    };
    return colors[type] || 'default';
  };

  const getTypeIcon = (type) => {
    return type === 'chatflow' ? <PlayCircleOutlined /> : <ApartmentOutlined />;
  };

  const FlowCard = ({ flow }) => (
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
        flow.flow_url && (
          <Button 
            type="text" 
            icon={<LinkOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              window.open(flow.flow_url, '_blank');
            }}
          >
            访问Flow
          </Button>
        ),
        ...(hasRole(['admin', 'developer']) ? [
          <Button 
            type="text" 
            danger
            icon={<DeleteOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(flow.id);
            }}
          >
            删除
          </Button>
        ] : [])
      ].filter(Boolean)}
      onClick={() => navigate(`/flows/${flow.id}`)}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          {getTypeIcon(flow.flow_type)}
          <Title level={5} style={{ margin: 0, marginLeft: '8px', flex: 1 }} ellipsis>
            {flow.name}
          </Title>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <Space wrap>
            <Tag color={getTypeColor(flow.flow_type)}>
              {flow.flow_type === 'workflow' ? 'Workflow' : 'ChatFlow'}
            </Tag>
            {flow.organization && (
              <Tag>
                {flow.organization}
              </Tag>
            )}
          </Space>
        </div>
        
        <Paragraph 
          type="secondary" 
          ellipsis={{ rows: 3 }}
          style={{ 
            fontSize: '13px',
            marginBottom: '12px',
            minHeight: '54px'
          }}
        >
          {flow.description || '暂无描述'}
        </Paragraph>
        
        <div style={{ marginTop: 'auto' }}>
          {flow.flow_url && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <LinkOutlined style={{ fontSize: '12px', marginRight: '4px', color: '#999' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {flow.flow_url.length > 30 ? `${flow.flow_url.substring(0, 30)}...` : flow.flow_url}
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
          <Title level={2} style={{ margin: 0 }}>Flow库</Title>
          <Text type="secondary">管理和浏览工作流和聊天流程</Text>
        </div>
        {hasRole(['admin', 'developer']) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/flows/new')}
          >
            新增Flow
          </Button>
        )}
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索Flow名称或描述"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="选择Flow类型"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('flow_type', value)}
            >
              <Option value="workflow">Workflow</Option>
              <Option value="chatflow">ChatFlow</Option>
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

      {/* Flow卡片网格 */}
      <Row gutter={[16, 16]}>
        {flows.map(flow => (
          <Col xs={24} sm={12} md={8} lg={6} key={flow.id}>
            <FlowCard flow={flow} />
          </Col>
        ))}
      </Row>

      {/* 空状态 */}
      {!loading && flows.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: '#999'
        }}>
          <ApartmentOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>暂无Flow</div>
          {hasRole(['admin', 'developer']) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/flows/new')}
            >
              添加第一个Flow
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

export default Flows;