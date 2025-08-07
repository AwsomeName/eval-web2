import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Space, 
  Row, 
  Col, 
  Tag, 
  message,
  Modal,
  Form,
  Table,
  Typography,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  TrophyOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BarChartOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { leaderboardsAPI } from '../utils/api'; // 导入API封装

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const Leaderboards = () => {
  const navigate = useNavigate();
  const { getToken, hasRole } = useAuth();
  const [leaderboards, setLeaderboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);

  const leaderboardTypes = [
    { value: 'model_performance', label: '模型性能榜' },
    { value: 'dataset_quality', label: '数据集质量榜' },
    { value: 'flow_efficiency', label: 'Flow效率榜' },
    { value: 'agent_capability', label: 'Agent能力榜' },
    { value: 'comprehensive', label: '综合评测榜' }
  ];

  useEffect(() => {
    fetchLeaderboards();
  }, [currentPage, searchTerm, typeFilter]);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && { type: typeFilter })
      };

      const data = await leaderboardsAPI.getAll(params);
      setLeaderboards(data.leaderboards);
      setTotal(data.total);
    } catch (error) {
      message.error(error.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await leaderboardsAPI.delete(id);
      message.success('删除成功');
      fetchLeaderboards();
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      'model_performance': <BarChartOutlined />,
      'dataset_quality': <TrophyOutlined />,
      'flow_efficiency': <TrophyOutlined />,
      'agent_capability': <TrophyOutlined />,
      'comprehensive': <TrophyOutlined />
    };
    return icons[type] || <TrophyOutlined />;
  };

  const getTypeColor = (type) => {
    const colors = {
      'model_performance': 'blue',
      'dataset_quality': 'green',
      'flow_efficiency': 'orange',
      'agent_capability': 'purple',
      'comprehensive': 'red'
    };
    return colors[type] || 'default';
  };

  const getTypeName = (type) => {
    const typeMap = leaderboardTypes.reduce((acc, item) => {
      acc[item.value] = item.label;
      return acc;
    }, {});
    return typeMap[type] || type;
  };

  const LeaderboardCard = ({ leaderboard }) => (
    <Card
      hoverable
      onClick={() => navigate(`/leaderboards/${leaderboard.id}`)}
      actions={[
        ...(hasRole(['admin', 'developer']) ? [
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/leaderboards/${leaderboard.id}`)}
          >
            编辑
          </Button>,
          <Popconfirm
            title="确认删除?"
            description="删除后无法恢复，确定要删除这个榜单吗？"
            onConfirm={() => handleDelete(leaderboard.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        ] : [])
      ]}
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          {getTypeIcon(leaderboard.leaderboard_type)}
          <Title level={4} style={{ margin: '0 0 0 8px', fontSize: '16px' }}>
            {leaderboard.name}
          </Title>
        </div>
        <Tag color={getTypeColor(leaderboard.leaderboard_type)}>
          {getTypeName(leaderboard.leaderboard_type)}
        </Tag>
      </div>
      
      <div style={{ minHeight: '60px', marginBottom: '12px' }}>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          {leaderboard.description || '暂无描述'}
        </Text>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontSize: '12px',
        color: '#999'
      }}>
        <span>参与数: {leaderboard.participant_count || 0}</span>
        <span>{new Date(leaderboard.created_at).toLocaleDateString()}</span>
      </div>

      {leaderboard.evaluation_metrics && (
        <div style={{ marginTop: '8px' }}>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            评测指标: {leaderboard.evaluation_metrics}
          </Text>
        </div>
      )}
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
        <Title level={2} style={{ margin: 0 }}>
          <TrophyOutlined style={{ marginRight: '12px' }} />
          榜单库
        </Title>
        {hasRole(['admin', 'developer']) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/leaderboards/new')}
          >
            创建榜单
          </Button>
        )}
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索榜单名称或描述"
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={fetchLeaderboards}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="榜单类型"
              allowClear
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
            >
              {leaderboardTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={10}>
            <Space>
              <Button 
                icon={<SearchOutlined />} 
                onClick={fetchLeaderboards}
              >
                搜索
              </Button>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('');
                  setCurrentPage(1);
                }}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 榜单统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {total}
              </div>
              <div style={{ color: '#666' }}>总榜单数</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {leaderboards.filter(lb => lb.leaderboard_type === 'model_performance').length}
              </div>
              <div style={{ color: '#666' }}>模型榜单</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {leaderboards.filter(lb => lb.leaderboard_type === 'agent_capability').length}
              </div>
              <div style={{ color: '#666' }}>Agent榜单</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                {leaderboards.filter(lb => lb.leaderboard_type === 'comprehensive').length}
              </div>
              <div style={{ color: '#666' }}>综合榜单</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 榜单列表 */}
      <Row gutter={[16, 16]}>
        {leaderboards.map(leaderboard => (
          <Col xs={24} sm={12} lg={8} xl={6} key={leaderboard.id}>
            <LeaderboardCard leaderboard={leaderboard} />
          </Col>
        ))}
      </Row>

      {/* 空状态 */}
      {!loading && leaderboards.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: '#999'
        }}>
          <TrophyOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
          <div>暂无榜单数据</div>
          {hasRole(['admin', 'developer']) && (
            <Button 
              type="primary" 
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/leaderboards/new')}
            >
              创建第一个榜单
            </Button>
          )}
        </div>
      )}

      {/* 分页 */}
      {total > pageSize && (
        <div style={{ textAlign: 'right', marginTop: '32px' }}>
          <Button.Group>
            <Button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              上一页
            </Button>
            <Button disabled>
              {currentPage} / {Math.ceil(total / pageSize)}
            </Button>
            <Button 
              disabled={currentPage >= Math.ceil(total / pageSize)}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              下一页
            </Button>
          </Button.Group>
        </div>
      )}
    </div>
  );
};

export default Leaderboards;