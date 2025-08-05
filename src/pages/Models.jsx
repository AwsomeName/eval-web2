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
  RobotOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const Models = () => {
  const navigate = useNavigate();
  const { user, getToken, hasRole } = useAuth();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    organization: ''
  });

  useEffect(() => {
    fetchModels();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`http://localhost:3001/api/models?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setModels(data.models);
        setPagination(prev => ({
          ...prev,
          total: data.total
        }));
      } else {
        message.error('获取模型列表失败');
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
      title: '确定删除这个模型吗？',
      content: '删除后将无法恢复，请谨慎操作。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/models/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${getToken()}`
            }
          });

          if (response.ok) {
            message.success('删除成功');
            fetchModels();
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
      '文本': 'blue',
      '语音': 'green',
      '多模态': 'purple',
      '文生图': 'orange',
      'emb': 'cyan',
      '图像': 'red'
    };
    return colors[type] || 'default';
  };

  const ModelCard = ({ model }) => (
    <Card
      hoverable
      style={{ height: '300px' }}
      bodyStyle={{ 
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={() => navigate(`/models/${model.id}`)}
    >
      <div style={{ flex: 1 }}>
        {/* 头部：模型名称、类型和删除按钮平行布局 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <RobotOutlined style={{ fontSize: '20px', marginRight: '8px', color: '#1890ff' }} />
            <Title level={5} style={{ margin: 0, marginRight: '8px' }} ellipsis>
              {model.name}
            </Title>
            <Tag color={getTypeColor(model.model_type)} style={{ marginLeft: '8px' }}>
              {model.model_type}
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
                handleDelete(model.id);
              }}
              style={{ flexShrink: 0 }}
            />
          )}
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <Space wrap>
            {model.organization && (
              <Tag>
                {model.organization}
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
            flex: 1
          }}
        >
          {model.description || '暂无描述'}
        </Paragraph>
        
        <div style={{ marginTop: 'auto' }}>
          {model.api_url && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              API: {model.api_url.length > 30 ? `${model.api_url.substring(0, 30)}...` : model.api_url}
            </Text>
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
          <Title level={2} style={{ margin: 0 }}>模型库</Title>
          <Text type="secondary">管理和测试各种AI模型</Text>
        </div>
        {hasRole(['admin', 'developer']) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/models/new')}
          >
            新增模型
          </Button>
        )}
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索模型名称或描述"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="选择模型类型"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('type', value)}
            >
              <Option value="文本">文本</Option>
              <Option value="语音">语音</Option>
              <Option value="多模态">多模态</Option>
              <Option value="文生图">文生图</Option>
              <Option value="emb">嵌入模型</Option>
              <Option value="图像">图像</Option>
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

      {/* 模型卡片网格 */}
      <Row gutter={[16, 16]}>
        {models.map(model => (
          <Col xs={24} sm={12} md={8} lg={6} key={model.id}>
            <ModelCard model={model} />
          </Col>
        ))}
      </Row>

      {/* 空状态 */}
      {!loading && models.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: '#999'
        }}>
          <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>暂无模型数据</div>
          {hasRole(['admin', 'developer']) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/models/new')}
            >
              添加第一个模型
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

export default Models;