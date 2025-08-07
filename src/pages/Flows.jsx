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
  ApartmentOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { flowsAPI } from '../utils/api'; // 导入API封装

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
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      };

      const data = await flowsAPI.getAll(params);
      setFlows(data.flows);
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
      title: '确定删除这个Flow吗？',
      content: '删除后将无法恢复，请谨慎操作。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await flowsAPI.delete(id);
          message.success('删除成功');
          fetchFlows();
        } catch (error) {
          message.error(error.message || '删除失败');
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
    return type === 'chatflow' 
      ? <PlayCircleOutlined style={{ fontSize: '20px', color: '#52c41a' }} /> 
      : <ApartmentOutlined style={{ fontSize: '20px', color: '#1890ff' }} />;
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
      onClick={() => navigate(`/flows/${flow.id}`)}
    >
      <div style={{ flex: 1 }}>
        {/* 头部：Flow名称、类型和删除按钮平行布局 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {getTypeIcon(flow.flow_type)}
            <Title level={5} style={{ margin: 0, marginLeft: '8px', marginRight: '8px' }} ellipsis>
              {flow.name}
            </Title>
            <Tag color={getTypeColor(flow.flow_type)} style={{ marginLeft: '8px' }}>
              {flow.flow_type === 'workflow' ? 'Workflow' : 'ChatFlow'}
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
                handleDelete(flow.id);
              }}
              style={{ flexShrink: 0 }}
            />
          )}
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <Space wrap>
            {flow.organization && (
              <Tag>
                {flow.organization}
              </Tag>
            )}
          </Space>
        </div>
        
        <div
          style={{ 
            fontSize: '13px',
            marginBottom: '12px',
            flex: 1,
            display: 'flex',  // 添加flex布局
            flexDirection: 'column',  // 垂直方向排列
            overflow: 'auto'  // 保留滚动功能
          }}
        >
          <MarkdownRenderer
            content={flow.description || '暂无描述'}
            isCard={true}
          />
        </div>
        
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