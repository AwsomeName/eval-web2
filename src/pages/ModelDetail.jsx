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
  Divider,
  Row,
  Col,
  Modal
} from 'antd';
import { 
  SaveOutlined, 
  RobotOutlined, 
  SendOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 预定义的API URL选项
const predefinedApiUrls = [
  { label: '自定义', value: '' },
  { label: '阿里云', value: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { label: 'DeepSeek', value: 'https://api.deepseek.com' }
];

const ModelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, hasRole } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState(null);
  const [editing, setEditing] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  // 添加缺失的状态
  const [selectedApiUrl, setSelectedApiUrl] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState(true);

  const isNew = id === 'new';

  useEffect(() => {
    if (!isNew) {
      fetchModel();
    } else {
      setEditing(true);
    }
  }, [id]);

  // 添加缺失的处理函数
  const handleApiUrlChange = (value) => {
    setSelectedApiUrl(value);
    setCustomApiUrl(value === '');
    if (value !== '') {
      form.setFieldsValue({ api_url: value });
    }
  };

  // 在 fetchModel 函数中添加对 API URL 类型的处理
  const fetchModel = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/models/${id}`);
      if (response.ok) {
        const data = await response.json();
        setModel(data);
        form.setFieldsValue(data);
        
        // 设置 API URL 类型
        const predefinedUrl = predefinedApiUrls.find(item => item.value === data.api_url);
        if (predefinedUrl) {
          setSelectedApiUrl(data.api_url);
          setCustomApiUrl(false);
        } else {
          setSelectedApiUrl('');
          setCustomApiUrl(true);
        }
      } else {
        message.error('获取模型信息失败');
        navigate('/models');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const url = isNew 
        ? 'http://localhost:3001/api/models'
        : `http://localhost:3001/api/models/${id}`;
      
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
        message.success(isNew ? '模型创建成功' : '模型更新成功');
        
        if (isNew) {
          navigate(`/models/${data.id}`);
        } else {
          setModel(data);
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

  const handleTest = async () => {
    if (!testInput.trim()) {
      message.warning('请输入测试内容');
      return;
    }

    setTesting(true);
    try {
      // 这里应该调用实际的模型API进行测试
      // 为了演示，我们模拟一个响应
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestOutput(
        `模型响应示例（基于输入：${testInput}）\n\n` +
        `这是一个模拟的模型响应。实际实现中，这里会调用模型的API endpoint，` +
        `使用配置的API Key和请求格式发送请求，并返回模型的实际输出结果。`
      );
    } catch (error) {
      message.error('测试失败，请检查模型配置');
    } finally {
      setTesting(false);
    }
  };

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
            onClick={() => navigate('/models')}
          >
            返回模型库
          </Button>
        </Space>
        <Title level={2} style={{ marginTop: '16px' }}>
          <RobotOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          {isNew ? '新增模型' : (editing ? '编辑模型' : model?.name)}
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* 模型信息表单 */}
        <Col xs={24} lg={16}>
          <Card 
            title="模型信息"
            extra={
              !isNew && hasRole(['admin', 'developer']) && (
                <Space>
                  {editing ? (
                    <>
                      <Button onClick={() => {
                        setEditing(false);
                        form.resetFields();
                        form.setFieldsValue(model);
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
                    label="模型名称"
                    name="name"
                    rules={[{ required: true, message: '请输入模型名称' }]}
                  >
                    <Input placeholder="请输入模型名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="模型类型"
                    name="model_type"
                    rules={[{ required: true, message: '请选择模型类型' }]}
                  >
                    <Select placeholder="请选择模型类型">
                      <Option value="文本">文本</Option>
                      <Option value="语音">语音</Option>
                      <Option value="多模态">多模态</Option>
                      <Option value="文生图">文生图</Option>
                      <Option value="emb">嵌入模型</Option>
                      <Option value="图像">图像</Option>
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
                    label="模型名称(Model Name)"
                    name="model_name"
                  >
                    <Input placeholder="请输入模型Name，如gpt-3.5-turbo" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]} align="middle">
                <Col xs={24} md={12}>
                  <Form.Item
                    label="API URL类型"
                    style={{ marginBottom: 0 }}
                  >
                    <Select 
                      value={selectedApiUrl} 
                      onChange={handleApiUrlChange}
                      style={{ width: '100%' }}
                    >
                      {predefinedApiUrls.map(item => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="API URL"
                    name="api_url"
                    rules={[{ required: true, message: '请输入API地址' }]}
                  >
                    <Input 
                      placeholder="https://api.example.com/v1/chat" 
                      disabled={!customApiUrl}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="API Key"
                name="api_key"
              >
                <Input.Password placeholder="请输入API密钥" />
              </Form.Item>

              <Form.Item
                label="模型描述"
                name="description"
              >
                <TextArea 
                  rows={4} 
                  placeholder="请输入模型的详细描述，包括功能特点、适用场景等"
                />
              </Form.Item>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="输入格式"
                    name="input_format"
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="描述模型的输入格式，例如JSON结构等"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="输出格式"
                    name="output_format"
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="描述模型的输出格式"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="使用示例"
                name="example"
              >
                <TextArea 
                  rows={4} 
                  placeholder="提供模型使用的具体示例"
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
                      {isNew ? '创建模型' : '保存修改'}
                    </Button>
                    <Button onClick={() => {
                      if (isNew) {
                        navigate('/models');
                      } else {
                        setEditing(false);
                        form.resetFields();
                        form.setFieldsValue(model);
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

        {/* 模型测试 */}
        {!isNew && (
          <Col xs={24} lg={8}>
            <Card title="模型测试" style={{ height: 'fit-content' }}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>测试输入：</Text>
                <TextArea
                  rows={4}
                  placeholder="请输入测试内容..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  style={{ marginTop: '8px' }}
                />
              </div>
              
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                loading={testing}
                onClick={handleTest}
                style={{ marginBottom: '16px', width: '100%' }}
              >
                发送测试
              </Button>

              {testOutput && (
                <div>
                  <Text strong>输出结果：</Text>
                  <div style={{ 
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px',
                    fontSize: '13px',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {testOutput}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ModelDetail;