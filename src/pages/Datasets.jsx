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
  DatabaseOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { datasetsAPI } from '../utils/api'; // 导入API封装

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const Datasets = () => {
  const navigate = useNavigate();
  const { user, getToken, hasRole } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    data_type: '',
    organization: ''
  });

  useEffect(() => {
    fetchDatasets();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      };

      const data = await datasetsAPI.getAll(params);
      setDatasets(data.datasets);
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
      title: '确定删除这个数据集吗？',
      content: '删除后将无法恢复，请谨慎操作。',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await datasetsAPI.delete(id);
          message.success('删除成功');
          fetchDatasets();
        } catch (error) {
          message.error(error.message || '删除失败');
        }
      }
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      '对话': 'blue',
      '文本分类': 'green',
      '数据生成': 'purple',
      '自动驾驶': 'orange',
      '语音': 'cyan',
      '图像': 'red',
      '视频': 'magenta',
      '多模态': 'gold'
    };
    return colors[type] || 'default';
  };

  const formatFileSize = (size) => {
    if (!size) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  };

  const DatasetCard = ({ dataset }) => (
    <Card
      hoverable
      style={{ height: '320px' }}
      bodyStyle={{ 
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={() => navigate(`/datasets/${dataset.id}`)}
    >
      <div style={{ flex: 1 }}>
        {/* 头部：数据集名称、类型和删除按钮平行布局 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <DatabaseOutlined style={{ fontSize: '20px', marginRight: '8px', color: '#52c41a' }} />
            <Title level={5} style={{ margin: 0, marginRight: '8px' }} ellipsis>
              {dataset.name}
            </Title>
            <Tag color={getTypeColor(dataset.data_type)} style={{ marginLeft: '8px' }}>
              {dataset.data_type}
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
                handleDelete(dataset.id);
              }}
              style={{ flexShrink: 0 }}
            />
          )}
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <Space wrap>
            {dataset.organization && (
              <Tag>
                {dataset.organization}
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
            content={dataset.description || '暂无描述'}
            isCard={true}
          />
        </div>
        
        <div style={{ marginBottom: '12px', marginTop: 'auto' }}>
          <Row gutter={[8, 4]}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                样本数: {dataset.sample_count ? dataset.sample_count.toLocaleString() : '-'}
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                大小: {formatFileSize(dataset.file_size)}
              </Text>
            </Col>
          </Row>
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          {dataset.file_path && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FolderOutlined style={{ fontSize: '12px', marginRight: '4px', color: '#999' }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {dataset.file_path.length > 25 ? `${dataset.file_path.substring(0, 25)}...` : dataset.file_path}
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
          <Title level={2} style={{ margin: 0 }}>数据集库</Title>
          <Text type="secondary">管理和浏览各种数据集资源</Text>
        </div>
        {hasRole(['admin', 'developer']) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/datasets/new')}
          >
            新增数据集
          </Button>
        )}
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索数据集名称或描述"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="选择数据类型"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('data_type', value)}
            >
              <Option value="对话">对话</Option>
              <Option value="文本分类">文本分类</Option>
              <Option value="数据生成">数据生成</Option>
              <Option value="自动驾驶">自动驾驶</Option>
              <Option value="语音">语音</Option>
              <Option value="图像">图像</Option>
              <Option value="视频">视频</Option>
              <Option value="多模态">多模态</Option>
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

      {/* 数据集卡片网格 */}
      <Row gutter={[16, 16]}>
        {datasets.map(dataset => (
          <Col xs={24} sm={12} md={8} lg={6} key={dataset.id}>
            <DatasetCard dataset={dataset} />
          </Col>
        ))}
      </Row>

      {/* 空状态 */}
      {!loading && datasets.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: '#999'
        }}>
          <DatabaseOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>暂无数据集</div>
          {hasRole(['admin', 'developer']) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/datasets/new')}
            >
              添加第一个数据集
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

export default Datasets;