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
  Divider
} from 'antd';
import { 
  SaveOutlined, 
  RobotOutlined, 
  ArrowLeftOutlined,
  LinkOutlined,
  MessageOutlined,
  ToolOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, hasRole } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState(null);
  const [editing, setEditing] = useState(false);

  const isNew = id === 'new';

  useEffect(() => {
    if (!isNew) {
      fetchAgent();
    } else {
      setEditing(true);
    }
  }, [id]);

  const fetchAgent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAgent(data);
        form.setFieldsValue(data);
      } else {
        message.error('获取Agent信息失败');
        navigate('/agents');
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
        ? `${API_BASE_URL}/api/agents`
        : `${API_BASE_URL}/api/agents/${id}`;
      
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
        message.success(isNew ? 'Agent创建成功' : 'Agent更新成功');
        
        if (isNew) {
          navigate(`/agents/${data.id}`);
        } else {
          setAgent(data);
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

  const getTypeIcon = (type) => {
    const icons = {
      'chatbot': <MessageOutlined />,
      'assistant': <RobotOutlined />,
      'workflow': <ToolOutlined />,
      'custom': <RobotOutlined />
    };
    return icons[type] || <RobotOutlined />;
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

  const getTypeName = (type) => {
    const names = {
      'chatbot': '聊天机器人',
      'assistant': '智能助手',
      'workflow': '工作流Agent',
      'custom': '自定义Agent'
    };
    return names[type] || type;
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
            onClick={() => navigate('/agents')}
          >
            返回Agent库
          </Button>
        </Space>
        <Title level={2} style={{ marginTop: '16px' }}>
          {getTypeIcon(agent?.agent_type)}
          <span style={{ marginLeft: '12px' }}>
            {isNew ? '新增Agent' : (editing ? '编辑Agent' : agent?.name)}
          </span>
        </Title>
        {!isNew && agent?.agent_type && (
          <div style={{ marginTop: '8px' }}>
            <Tag color={getTypeColor(agent.agent_type)}>
              {getTypeName(agent.agent_type)}
            </Tag>
            {agent.organization && (
              <Tag>
                {agent.organization}
              </Tag>
            )}
          </div>
        )}
      </div>

      <Row gutter={[24, 24]}>
        {/* Agent信息表单 */}
        <Col xs={24} lg={16}>
          <Card 
            title="Agent信息"
            extra={
              !isNew && hasRole(['admin', 'developer']) && (
                <Space>
                  {editing ? (
                    <>
                      <Button onClick={() => {
                        setEditing(false);
                        form.resetFields();
                        form.setFieldsValue(agent);
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
                    label="Agent名称"
                    name="name"
                    rules={[{ required: true, message: '请输入Agent名称' }]}
                  >
                    <Input placeholder="请输入Agent名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Agent类型"
                    name="agent_type"
                    rules={[{ required: true, message: '请选择Agent类型' }]}
                  >
                    <Select placeholder="请选择Agent类型">
                      <Option value="chatbot">聊天机器人</Option>
                      <Option value="assistant">智能助手</Option>
                      <Option value="workflow">工作流Agent</Option>
                      <Option value="custom">自定义Agent</Option>
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
                    label="版本号"
                    name="version"
                  >
                    <Input placeholder="如：v1.0.0" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Agent访问地址"
                name="agent_url"
                rules={[{ required: true, message: '请输入Agent访问地址' }]}
              >
                <Input 
                  placeholder="https://your-agent-url.com" 
                  addonBefore="🤖"
                />
              </Form.Item>

              <Form.Item
                label="Agent描述"
                name="description"
              >
                <TextArea 
                  rows={4} 
                  placeholder="请输入Agent的详细描述，包括功能、能力等"
                />
              </Form.Item>

              <Form.Item
                label="指令格式"
                name="instruction_format"
              >
                <TextArea 
                  rows={3} 
                  placeholder="描述Agent接受的指令格式和语法"
                />
              </Form.Item>

              <Form.Item
                label="响应格式"
                name="response_format"
              >
                <TextArea 
                  rows={3} 
                  placeholder="描述Agent的响应格式和结构"
                />
              </Form.Item>

              <Form.Item
                label="API密钥"
                name="api_key"
                extra="如果Agent需要API密钥访问，请填写此字段"
              >
                <Input.Password placeholder="请输入API密钥（如果需要）" />
              </Form.Item>

              <Form.Item
                label="使用示例"
                name="example"
              >
                <TextArea 
                  rows={4} 
                  placeholder="提供Agent使用的具体示例，包括指令和响应样例"
                />
              </Form.Item>

              <Form.Item
                label="技术栈"
                name="tech_stack"
              >
                <Input placeholder="如：LangChain, OpenAI, FastAPI, Python" />
              </Form.Item>

              <Form.Item
                label="支持的功能"
                name="capabilities"
              >
                <TextArea 
                  rows={3} 
                  placeholder="列出Agent支持的主要功能和能力"
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
                      {isNew ? '创建Agent' : '保存修改'}
                    </Button>
                    <Button onClick={() => {
                      if (isNew) {
                        navigate('/agents');
                      } else {
                        setEditing(false);
                        form.resetFields();
                        form.setFieldsValue(agent);
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

        {/* Agent操作和信息 */}
        {!isNew && (
          <Col xs={24} lg={8}>
            <Card title="快速操作" style={{ marginBottom: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {agent?.agent_url && (
                  <Button 
                    icon={<LinkOutlined />} 
                    block
                    onClick={() => window.open(agent.agent_url, '_blank')}
                  >
                    访问Agent
                  </Button>
                )}
                <Button 
                  icon={<MessageOutlined />} 
                  block
                  onClick={() => {
                    message.info('对话测试功能开发中');
                  }}
                >
                  测试对话
                </Button>
                <Button 
                  icon={<ExportOutlined />} 
                  block
                  onClick={() => {
                    message.info('导出配置功能开发中');
                  }}
                >
                  导出配置
                </Button>
              </Space>
            </Card>

            <Card title="Agent信息">
              <div style={{ marginBottom: '16px' }}>
                <Text type="secondary">创建时间</Text>
                <br />
                <Text>
                  {agent?.created_at ? new Date(agent.created_at).toLocaleString() : '-'}
                </Text>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text type="secondary">更新时间</Text>
                <br />
                <Text>
                  {agent?.updated_at ? new Date(agent.updated_at).toLocaleString() : '-'}
                </Text>
              </div>

              {agent?.version && (
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">当前版本</Text>
                  <br />
                  <Tag color="blue">{agent.version}</Tag>
                </div>
              )}

              {agent?.tech_stack && (
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">技术栈</Text>
                  <br />
                  <Paragraph style={{ marginTop: '4px', marginBottom: 0 }}>
                    {agent.tech_stack}
                  </Paragraph>
                </div>
              )}

              {agent?.capabilities && (
                <div>
                  <Text type="secondary">支持功能</Text>
                  <br />
                  <Paragraph style={{ marginTop: '4px', marginBottom: 0 }}>
                    {agent.capabilities}
                  </Paragraph>
                </div>
              )}
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default AgentDetail;