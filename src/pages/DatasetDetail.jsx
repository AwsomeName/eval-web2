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
  Upload,
  Table,
  Tag
} from 'antd';
import { 
  SaveOutlined, 
  DatabaseOutlined, 
  ArrowLeftOutlined,
  UploadOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DatasetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, hasRole } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataset, setDataset] = useState(null);
  const [editing, setEditing] = useState(false);
  const [sampleData, setSampleData] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);

  const isNew = id === 'new';

  useEffect(() => {
    if (!isNew) {
      fetchDataset();
      fetchSampleData();
    } else {
      setEditing(true);
    }
  }, [id]);

  const fetchDataset = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/datasets/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDataset(data);
        form.setFieldsValue(data);
      } else {
        message.error('获取数据集信息失败');
        navigate('/datasets');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const fetchSampleData = async () => {
    try {
      // 模拟获取数据集样本数据
      const sampleData = [
        {
          key: 1,
          index: 1,
          content: '这是一个示例文本数据，展示数据集的内容格式...',
          label: '正面',
          metadata: { source: 'web', length: 25 }
        },
        {
          key: 2,
          index: 2,
          content: '另一个数据样本，用于展示数据的多样性...',
          label: '负面',
          metadata: { source: 'book', length: 20 }
        },
        {
          key: 3,
          index: 3,
          content: '第三个示例数据，显示更多的数据格式...',
          label: '中性',
          metadata: { source: 'news', length: 18 }
        }
      ];
      setSampleData(sampleData);
    } catch (error) {
      console.error('获取样本数据失败:', error);
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const url = isNew 
        ? `${API_BASE_URL}/api/datasets`
        : `${API_BASE_URL}/api/datasets/${id}`;
      
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
        message.success(isNew ? '数据集创建成功' : '数据集更新成功');
        
        if (isNew) {
          navigate(`/datasets/${data.id}`);
        } else {
          setDataset(data);
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

  const sampleColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}>
          {text}
        </Paragraph>
      )
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
      width: 100,
      render: (label) => (
        <Tag color={label === '正面' ? 'green' : label === '负面' ? 'red' : 'default'}>
          {label}
        </Tag>
      )
    },
    {
      title: '元数据',
      dataIndex: 'metadata',
      key: 'metadata',
      width: 120,
      render: (metadata) => (
        <div style={{ fontSize: '12px' }}>
          <div>来源: {metadata.source}</div>
          <div>长度: {metadata.length}</div>
        </div>
      )
    }
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
            onClick={() => navigate('/datasets')}
          >
            返回数据集库
          </Button>
        </Space>
        <Title level={2} style={{ marginTop: '16px' }}>
          <DatabaseOutlined style={{ marginRight: '12px', color: '#52c41a' }} />
          {isNew ? '新增数据集' : (editing ? '编辑数据集' : dataset?.name)}
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* 数据集信息表单 */}
        <Col xs={24} lg={16}>
          <Card 
            title="数据集信息"
            extra={
              !isNew && hasRole(['admin', 'developer']) && (
                <Space>
                  {editing ? (
                    <>
                      <Button onClick={() => {
                        setEditing(false);
                        form.resetFields();
                        form.setFieldsValue(dataset);
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
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="数据集名称"
                    name="name"
                    rules={[{ required: true, message: '请输入数据集名称' }]}
                  >
                    <Input placeholder="请输入数据集名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="数据类型"
                    name="data_type"
                    rules={[{ required: true, message: '请选择数据类型' }]}
                  >
                    <Select placeholder="请选择数据类型">
                      <Option value="对话">对话</Option>
                      <Option value="文本分类">文本分类</Option>
                      <Option value="数据生成">数据生成</Option>
                      <Option value="自动驾驶">自动驾驶</Option>
                      <Option value="语音">语音</Option>
                      <Option value="图像">图像</Option>
                      <Option value="视频">视频</Option>
                      <Option value="多模态">多模态</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="发布机构"
                    name="organization"
                  >
                    <Input placeholder="请输入发布机构" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="样本数量"
                    name="sample_count"
                  >
                    <Input type="number" placeholder="请输入样本数量" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="存储路径"
                name="file_path"
                rules={[{ required: true, message: '请输入存储路径' }]}
              >
                <Input placeholder="/mnt/nfs/datasets/your-dataset" />
              </Form.Item>

              <Form.Item
                label="数据集描述"
                name="description"
              >
                <TextArea 
                  rows={4} 
                  placeholder="请输入数据集的详细描述，包括数据来源、格式、用途等"
                />
              </Form.Item>

              <Form.Item
                label="数据格式说明"
                name="format_description"
              >
                <TextArea 
                  rows={3} 
                  placeholder="描述数据的具体格式，如JSON结构、文件类型等"
                />
              </Form.Item>

              <Form.Item
                label="使用示例"
                name="example"
              >
                <TextArea 
                  rows={4} 
                  placeholder="提供数据集使用的具体示例"
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
                      {isNew ? '创建数据集' : '保存修改'}
                    </Button>
                    <Button onClick={() => {
                      if (isNew) {
                        navigate('/datasets');
                      } else {
                        setEditing(false);
                        form.resetFields();
                        form.setFieldsValue(dataset);
                      }
                    }}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              )}
            </Form>
          </Card>
        </Col>

        {/* 数据集统计和操作 */}
        {!isNew && (
          <Col xs={24} lg={8}>
            <Card title="数据集统计" style={{ marginBottom: '24px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                      {dataset?.sample_count?.toLocaleString() || '-'}
                    </Title>
                    <Text type="secondary">样本数量</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                      {dataset?.file_size ? `${(dataset.file_size / 1024 / 1024).toFixed(1)}MB` : '-'}
                    </Title>
                    <Text type="secondary">文件大小</Text>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="数据操作">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  icon={<EyeOutlined />} 
                  block
                  onClick={() => setPreviewVisible(true)}
                >
                  预览数据样本
                </Button>
                <Button 
                  icon={<DownloadOutlined />} 
                  block
                >
                  下载数据集
                </Button>
                {hasRole(['admin', 'developer']) && (
                  <Upload
                    accept=".json,.csv,.txt"
                    showUploadList={false}
                    beforeUpload={() => {
                      message.info('文件上传功能开发中');
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />} block>
                      上传新版本
                    </Button>
                  </Upload>
                )}
              </Space>
            </Card>
          </Col>
        )}
      </Row>

      {/* 数据预览模态框 */}
      {!isNew && (
        <Modal
          title="数据样本预览"
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          footer={null}
          width={800}
        >
          <Table
            columns={sampleColumns}
            dataSource={sampleData}
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </Modal>
      )}
    </div>
  );
};

export default DatasetDetail;