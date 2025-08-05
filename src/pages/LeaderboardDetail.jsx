import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Typography, 
  Space, 
  message,
  Row,
  Col,
  Tag,
  Table,
  Upload,
  Modal,
  Divider,
  Progress,
  Statistic
} from 'antd';
import { 
  SaveOutlined, 
  TrophyOutlined, 
  ArrowLeftOutlined,
  DownloadOutlined,
  UploadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BarChartOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const LeaderboardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, hasRole } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);
  const [results, setResults] = useState([]);
  const [editing, setEditing] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [addResultModalVisible, setAddResultModalVisible] = useState(false);
  const [resultForm] = Form.useForm();

  const isNew = id === 'new';

  const leaderboardTypes = [
    { value: 'model_performance', label: '模型性能榜' },
    { value: 'dataset_quality', label: '数据集质量榜' },
    { value: 'flow_efficiency', label: 'Flow效率榜' },
    { value: 'agent_capability', label: 'Agent能力榜' },
    { value: 'comprehensive', label: '综合评测榜' }
  ];

  useEffect(() => {
    if (!isNew) {
      fetchLeaderboard();
      fetchResults();
    } else {
      setEditing(true);
    }
  }, [id]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/leaderboards/${id}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
        form.setFieldsValue(data);
      } else {
        message.error('获取榜单信息失败');
        navigate('/leaderboards');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    setResultsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/leaderboards/${id}/results`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('获取榜单结果失败:', error);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const url = isNew 
        ? 'http://localhost:3001/api/leaderboards'
        : `http://localhost:3001/api/leaderboards/${id}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const data = await response.json();
        message.success(isNew ? '榜单创建成功' : '榜单更新成功');
        
        if (isNew) {
          navigate(`/leaderboards/${data.id}`);
        } else {
          setLeaderboard(data);
          setEditing(false);
        }
      } else {
        const errorData = await response.json();
        message.error(errorData.error || '保存失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleAddResult = async (values) => {
    try {
      const response = await fetch(`http://localhost:3001/api/leaderboards/${id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success('结果添加成功');
        setAddResultModalVisible(false);
        resultForm.resetFields();
        fetchResults();
      } else {
        const errorData = await response.json();
        message.error(errorData.error || '添加失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/leaderboards/${id}/export`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${leaderboard?.name || 'leaderboard'}_results.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        message.success('导出成功');
      } else {
        message.error('导出失败');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    }
  };

  const uploadProps = {
    name: 'file',
    action: `http://localhost:3001/api/leaderboards/${id}/import`,
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    accept: '.csv',
    onChange(info) {
      if (info.file.status === 'done') {
        message.success('导入成功');
        setUploadModalVisible(false);
        fetchResults();
      } else if (info.file.status === 'error') {
        message.error('导入失败');
      }
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

  // 榜单结果表格列配置
  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => {
        if (rank === 1) return <Tag color="gold">🥇 1</Tag>;
        if (rank === 2) return <Tag color="silver">🥈 2</Tag>;
        if (rank === 3) return <Tag color="orange">🥉 3</Tag>;
        return <Tag>{rank}</Tag>;
      }
    },
    {
      title: '参与者/模型',
      dataIndex: 'participant_name',
      key: 'participant_name',
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (score, record) => {
        const maxScore = Math.max(...results.map(r => r.score));
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        return (
          <div>
            <div style={{ fontWeight: 'bold' }}>{score}</div>
            <Progress percent={percentage} size="small" showInfo={false} />
          </div>
        );
      }
    },
    {
      title: '指标详情',
      dataIndex: 'metrics',
      key: 'metrics',
      render: (metrics) => {
        try {
          const parsed = JSON.parse(metrics || '{}');
          return (
            <div>
              {Object.entries(parsed).map(([key, value]) => (
                <div key={key} style={{ fontSize: '12px' }}>
                  <Text type="secondary">{key}:</Text> {value}
                </div>
              ))}
            </div>
          );
        } catch {
          return metrics || '-';
        }
      }
    },
    {
      title: '提交时间',
      dataIndex: 'submission_time',
      key: 'submission_time',
      render: (time) => new Date(time).toLocaleString()
    },
    ...(hasRole(['admin', 'developer']) ? [{
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              resultForm.setFieldsValue({
                ...record,
                metrics: JSON.stringify(JSON.parse(record.metrics || '{}'), null, 2)
              });
              setAddResultModalVisible(true);
            }}
          />
          <Button 
            type="text" 
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={async () => {
              try {
                const response = await fetch(
                  `http://localhost:3001/api/leaderboards/${id}/results/${record.id}`,
                  {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                  }
                );
                if (response.ok) {
                  message.success('删除成功');
                  fetchResults();
                } else {
                  message.error('删除失败');
                }
              } catch (error) {
                message.error('网络错误');
              }
            }}
          />
        </Space>
      )
    }] : [])
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px' }}>加载中...</div>;
  }

  return (
    <div>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/leaderboards')}
          >
            返回榜单库
          </Button>
        </Space>
        <Title level={2} style={{ marginTop: '16px' }}>
          {getTypeIcon(leaderboard?.leaderboard_type)}
          <span style={{ marginLeft: '12px' }}>
            {isNew ? '新增榜单' : (editing ? '编辑榜单' : leaderboard?.name)}
          </span>
        </Title>
        {!isNew && leaderboard?.leaderboard_type && (
          <div style={{ marginTop: '8px' }}>
            <Tag color={getTypeColor(leaderboard.leaderboard_type)}>
              {getTypeName(leaderboard.leaderboard_type)}
            </Tag>
          </div>
        )}
      </div>

      <Row gutter={[24, 24]}>
        {/* 榜单信息 */}
        <Col xs={24} lg={16}>
          <Card 
            title="榜单信息"
            extra={
              !isNew && hasRole(['admin', 'developer']) && (
                <Space>
                  {editing ? (
                    <>
                      <Button onClick={() => {
                        setEditing(false);
                        form.resetFields();
                        form.setFieldsValue(leaderboard);
                      }}>
                        取消
                      </Button>
                      <Button 
                        type="primary" 
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={() => form.submit()}
                      >
                        保存
                      </Button>
                    </>
                  ) : (
                    <Button 
                      type="primary" 
                      onClick={() => setEditing(true)}
                    >
                      编辑
                    </Button>
                  )}
                </Space>
              )
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              disabled={!editing && !isNew}
            >
              <Form.Item
                label="榜单名称"
                name="name"
                rules={[{ required: true, message: '请输入榜单名称' }]}
              >
                <Input placeholder="输入榜单名称" />
              </Form.Item>

              <Form.Item
                label="榜单类型"
                name="leaderboard_type"
                rules={[{ required: true, message: '请选择榜单类型' }]}
              >
                <Select placeholder="选择榜单类型">
                  {leaderboardTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="描述"
                name="description"
              >
                <TextArea 
                  rows={4} 
                  placeholder="输入榜单描述"
                />
              </Form.Item>

              <Form.Item
                label="评测指标"
                name="evaluation_metrics"
                rules={[{ required: true, message: '请输入评测指标' }]}
              >
                <Input placeholder="如: 准确率, F1分数, BLEU等" />
              </Form.Item>

              <Form.Item
                label="评测数据集"
                name="dataset_info"
              >
                <TextArea 
                  rows={3} 
                  placeholder="输入评测数据集信息"
                />
              </Form.Item>

              {(editing || isNew) && (
                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={saving}
                    >
                      {isNew ? '创建榜单' : '保存修改'}
                    </Button>
                    {!isNew && (
                      <Button onClick={() => {
                        setEditing(false);
                        form.setFieldsValue(leaderboard);
                      }}>
                        取消
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              )}
            </Form>
          </Card>

          {/* 榜单结果 */}
          {!isNew && (
            <Card 
              title="榜单结果"
              style={{ marginTop: '24px' }}
              extra={
                hasRole(['admin', 'developer']) && (
                  <Space>
                    <Button 
                      icon={<PlusOutlined />}
                      onClick={() => setAddResultModalVisible(true)}
                    >
                      添加结果
                    </Button>
                    <Button 
                      icon={<UploadOutlined />}
                      onClick={() => setUploadModalVisible(true)}
                    >
                      批量导入
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={handleExport}
                    >
                      导出
                    </Button>
                  </Space>
                )
              }
            >
              <Table
                columns={columns}
                dataSource={results}
                rowKey="id"
                loading={resultsLoading}
                pagination={false}
                size="small"
                locale={{
                  emptyText: (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <TrophyOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                      <div style={{ marginTop: '16px', color: '#999' }}>暂无榜单结果</div>
                      {hasRole(['admin', 'developer']) && (
                        <Button 
                          type="primary" 
                          style={{ marginTop: '12px' }}
                          onClick={() => setAddResultModalVisible(true)}
                        >
                          添加第一个结果
                        </Button>
                      )}
                    </div>
                  )
                }}
              />
            </Card>
          )}
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {!isNew && (
            <>
              {/* 榜单统计 */}
              <Card title="榜单统计" style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic 
                      title="参与数量" 
                      value={results.length} 
                      prefix={<TrophyOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="最高得分" 
                      value={results.length > 0 ? Math.max(...results.map(r => r.score)) : 0}
                      precision={2}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="平均得分" 
                      value={results.length > 0 ? 
                        (results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0
                      }
                      precision={2}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="最低得分" 
                      value={results.length > 0 ? Math.min(...results.map(r => r.score)) : 0}
                      precision={2}
                    />
                  </Col>
                </Row>
              </Card>

              {/* 榜单信息 */}
              <Card title="详细信息">
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>创建时间:</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(leaderboard?.created_at).toLocaleString()}
                  </Text>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>更新时间:</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(leaderboard?.updated_at).toLocaleString()}
                  </Text>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <Text strong>创建者:</Text>
                  <br />
                  <Text type="secondary">{leaderboard?.creator || '系统'}</Text>
                </div>

                {leaderboard?.dataset_info && (
                  <div>
                    <Text strong>评测数据集:</Text>
                    <br />
                    <Paragraph 
                      style={{ marginTop: '4px', fontSize: '12px' }}
                      ellipsis={{ rows: 3, expandable: true }}
                    >
                      {leaderboard.dataset_info}
                    </Paragraph>
                  </div>
                )}
              </Card>
            </>
          )}
        </Col>
      </Row>

      {/* 添加结果模态框 */}
      <Modal
        title="添加榜单结果"
        open={addResultModalVisible}
        onCancel={() => {
          setAddResultModalVisible(false);
          resultForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={resultForm}
          layout="vertical"
          onFinish={handleAddResult}
        >
          <Form.Item
            label="参与者/模型名称"
            name="participant_name"
            rules={[{ required: true, message: '请输入参与者名称' }]}
          >
            <Input placeholder="输入参与者或模型名称" />
          </Form.Item>

          <Form.Item
            label="得分"
            name="score"
            rules={[{ required: true, message: '请输入得分' }]}
          >
            <Input type="number" step="0.01" placeholder="输入得分" />
          </Form.Item>

          <Form.Item
            label="排名"
            name="rank"
            rules={[{ required: true, message: '请输入排名' }]}
          >
            <Input type="number" placeholder="输入排名" />
          </Form.Item>

          <Form.Item
            label="指标详情 (JSON格式)"
            name="metrics"
          >
            <TextArea 
              rows={6} 
              placeholder='{\n  "accuracy": 0.95,\n  "f1_score": 0.87,\n  "precision": 0.92\n}'
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加结果
              </Button>
              <Button onClick={() => {
                setAddResultModalVisible(false);
                resultForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入模态框 */}
      <Modal
        title="批量导入榜单结果"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">请上传CSV格式文件，文件应包含以下列:</Text>
          <ul style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            <li>participant_name: 参与者名称</li>
            <li>score: 得分</li>
            <li>rank: 排名</li>
            <li>metrics: 指标详情 (JSON字符串)</li>
          </ul>
        </div>
        
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined style={{ fontSize: '48px' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持CSV格式文件，确保数据格式正确
          </p>
        </Dragger>
      </Modal>
    </div>
  );
};

export default LeaderboardDetail;