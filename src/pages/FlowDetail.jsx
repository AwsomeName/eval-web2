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
  ApartmentOutlined, 
  ArrowLeftOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FlowDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, hasRole } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flow, setFlow] = useState(null);
  const [editing, setEditing] = useState(false);

  const isNew = id === 'new';

  useEffect(() => {
    if (!isNew) {
      fetchFlow();
    } else {
      setEditing(true);
    }
  }, [id]);

  const fetchFlow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/flows/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFlow(data);
        form.setFieldsValue(data);
      } else {
        message.error('获取Flow信息失败');
        navigate('/flows');
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
        ? 'http://localhost:3001/api/flows'
        : `http://localhost:3001/api/flows/${id}`;
      
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
        message.success(isNew ? 'Flow创建成功' : 'Flow更新成功');
        
        if (isNew) {
          navigate(`/flows/${data.id}`);
        } else {
          setFlow(data);
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
    return type === 'chatflow' ? <PlayCircleOutlined /> : <ApartmentOutlined />;
  };

  const getTypeColor = (type) => {
    return type === 'chatflow' ? 'green' : 'blue';
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
            onClick={() => navigate('/flows')}
          >
            返回Flow库
          </Button>
        </Space>
        <Title level={2} style={{ marginTop: '16px' }}>
          {getTypeIcon(flow?.flow_type)}
          <span style={{ marginLeft: '12px' }}>
            {isNew ? '新增Flow' : (editing ? '编辑Flow' : flow?.name)}
          </span>
        </Title>
        {!isNew && flow?.flow_type && (
          <div style={{ marginTop: '8px' }}>
            <Tag color={getTypeColor(flow.flow_type)}>
              {flow.flow_type === 'workflow' ? 'Workflow' : 'ChatFlow'}
            </Tag>
            {flow.organization && (
              <Tag>
                {flow.organization}
              </Tag>
            )}
          </div>
        )}
      </div>

      <Row gutter={[24, 24]}>
        {/* Flow信息表单 */}
        <Col xs={24} lg={16}>
          <Card 
            title="Flow信息"
            extra={
              !isNew && hasRole(['admin', 'developer']) && (
                <Space>
                  {editing ? (
                    <>
                      <Button onClick={() => {
                        setEditing(false);
                        form.resetFields();
                        form.setFieldsValue(flow);
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
                    label="Flow名称"
                    name="name"
                    rules={[{ required: true, message: '请输入Flow名称' }]}
                  >
                    <Input placeholder="请输入Flow名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Flow类型"
                    name="flow_type"
                    rules={[{ required: true, message: '请选择Flow类型' }]}
                  >
                    <Select placeholder="请选择Flow类型">
                      <Option value="workflow">Workflow</Option>
                      <Option value="chatflow">ChatFlow</Option>
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
                label="Flow访问地址"
                name="flow_url"
                rules={[{ required: true, message: '请输入Flow访问地址' }]}
              >
                <Input 
                  placeholder="https://your-flow-url.com" 
                  addonBefore="🔗"
                />
              </Form.Item>

              <Form.Item
                label="Flow描述"
                name="description"
              >
                <TextArea 
                  rows={4} 
                  placeholder="请输入Flow的详细描述，包括功能、用途等"
                />
              </Form.Item>

              <Form.Item
                label="输入格式说明"
                name="input_format"
              >
                <TextArea 
                  rows={3} 
                  placeholder="描述Flow的输入参数格式，如JSON结构等"
                />
              </Form.Item>

              <Form.Item
                label="输出格式说明"
                name="output_format"
              >
                <TextArea 
                  rows={3} 
                  placeholder="描述Flow的输出结果格式"
                />
              </Form.Item>

              <Form.Item
                label="API密钥"
                name="api_key"
                extra="如果Flow需要API密钥访问，请填写此字段"
              >
                <Input.Password placeholder="请输入API密钥（如果需要）" />
              </Form.Item>

              <Form.Item
                label="使用示例"
                name="example"
              >
                <TextArea 
                  rows={4} 
                  placeholder="提供Flow使用的具体示例，包括输入输出样例"
                />
              </Form.Item>

              <Form.Item
                label="技术栈"
                name="tech_stack"
              >
                <Input placeholder="如：LangChain, OpenAI, FastAPI" />
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
                      {isNew ? '创建Flow' : '保存修改'}
                    </Button>
                    <Button onClick={() => {
                      if (isNew) {
                        navigate('/flows');
                      } else {
                        setEditing(false);
                        form.resetFields();
                        form.setFieldsValue(flow);
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

        {/* Flow操作和信息 */}
        {!isNew && (
          <Col xs={24} lg={8}>
            <Card title="快速操作" style={{ marginBottom: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {flow?.flow_url && (
                  <Button 
                    icon={<LinkOutlined />} 
                    block
                    onClick={() => window.open(flow.flow_url, '_blank')}
                  >
                    访问Flow
                  </Button>
                )}
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

            <Card title="Flow信息">
              <div style={{ marginBottom: '16px' }}>
                <Text type="secondary">创建时间</Text>
                <br />
                <Text>
                  {flow?.created_at ? new Date(flow.created_at).toLocaleString() : '-'}
                </Text>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text type="secondary">更新时间</Text>
                <br />
                <Text>
                  {flow?.updated_at ? new Date(flow.updated_at).toLocaleString() : '-'}
                </Text>
              </div>

              {flow?.version && (
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">当前版本</Text>
                  <br />
                  <Tag color="blue">{flow.version}</Tag>
                </div>
              )}

              {flow?.tech_stack && (
                <div>
                  <Text type="secondary">技术栈</Text>
                  <br />
                  <Paragraph style={{ marginTop: '4px', marginBottom: 0 }}>
                    {flow.tech_stack}
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

export default FlowDetail;