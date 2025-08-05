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
  EditOutlined, 
  SaveOutlined, 
  SendOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import TestResultDisplay from '../components/TestResultDisplay';
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
  const [isStreaming, setIsStreaming] = useState(false);
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
      form.setFieldsValue({ access_url: value });
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
        const predefinedUrl = predefinedApiUrls.find(item => item.value === data.access_url);
        if (predefinedUrl) {
          setSelectedApiUrl(data.access_url);
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

    const currentFormValues = form.getFieldsValue();
    const accessUrl = currentFormValues.access_url || model?.access_url;
    const accessKey = currentFormValues.access_key || model?.access_key;
    const modelName = currentFormValues.model_name || model?.model_name;
    const modelType = currentFormValues.model_type || model?.model_type;

    if (!accessUrl || !accessKey || !modelName) {
      const missingFields = [];
      if (!accessUrl) missingFields.push('API URL');
      if (!accessKey) missingFields.push('API Key');
      if (!modelName) missingFields.push('模型名称');
      
      const errorMsg = `请先配置完整的模型信息，缺少：${missingFields.join('、')}`;
      message.error(errorMsg);
      setTestOutput(`配置错误: ${errorMsg}`);
      return;
    }

    if (modelType !== 'text') {
      const warningMsg = '当前仅支持文本模型的测试';
      message.warning(warningMsg);
      setTestOutput(`不支持的模型类型: ${modelType}\n${warningMsg}`);
      return;
    }

    setTesting(true);
    setIsStreaming(true);
    setTestOutput('');

    try {
      const requestBody = {
        model: modelName,
        messages: [{
          role: 'user',
          content: testInput
        }],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      };

      const requestUrl = `${accessUrl}/chat/completions`;
      setTestOutput('正在连接API...\n\n');

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        setIsStreaming(false);
        const errorText = await response.text();
        
        let errorMessage = 'API调用失败';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        setTestOutput(`## 测试失败\n\n**错误信息:** ${errorMessage}\n\n**状态码:** ${response.status}\n\n**请检查:**\n- API URL 是否正确\n- API Key 是否有效\n- 模型名称是否正确\n- 网络连接是否正常`);
        message.error(errorMessage);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      setTestOutput('## 测试结果\n\n');

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setIsStreaming(false);
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              setIsStreaming(false);
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                accumulatedContent += content;
                setTestOutput(accumulatedContent);
              }
            } catch (e) {
              console.warn('JSON解析错误:', e.message);
            }
          }
        }
      }

      if (!accumulatedContent) {
        setTestOutput('模型返回了空响应，请检查输入内容或模型配置。');
        message.warning('模型返回了空响应');
      } else {
        message.success('测试完成');
      }

    } catch (error) {
      console.error('测试失败:', error);
      setIsStreaming(false);
      setTestOutput(`## 网络错误\n\n**错误信息:** ${error.message}\n\n**可能原因:**\n- 网络连接问题\n- CORS跨域限制\n- API服务不可用\n- 请求超时`);
      message.error(`网络错误: ${error.message}`);
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <Title level={2} style={{ margin: 0 }}>
          <RobotOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          {isNew ? '新增模型' : (editing ? '编辑模型' : model?.name)}
        </Title>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/models')}
        >
          返回模型库
        </Button>
      </div>

      <Row gutter={[24, 24]}>
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

              <div style={{ marginTop: '16px' }}>
                <div style={{ marginTop: '8px' }}>
                  <TestResultDisplay 
                    output={testOutput}
                    isLoading={testing}
                    isStreaming={isStreaming}
                    onClear={() => setTestOutput('')}
                  />
                </div>
              </div>
            </Card>
          </Col>
        )}

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
                      <Option value="text">文本</Option>
                      <Option value="audio">语音</Option>
                      <Option value="multimodal">多模态</Option>
                      <Option value="text2image">文生图</Option>
                      <Option value="embedding">嵌入模型</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="发布机构"
                    name="publisher"
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
                    name="access_url"
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
                name="access_key"
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
      </Row>
    </div>
  );
};

export default ModelDetail;