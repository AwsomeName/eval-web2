import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { modelsAPI } from '../utils/api';
import { validateMediaFile, getMediaType, createPreviewUrl, revokePreviewUrl } from '../utils/mediaUtils';
import { handleTextTest, handleMultimodalTest } from '../services/modelTestService';
// 注意：handleImageGenerationTest使用动态导入，无需在这里添加静态导入
import {
  Form, Input, Select, Button, Card, Row, Col, Typography, 
  Space, message, Upload, Modal, Tabs
} from 'antd';
import {
  SaveOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined,
  RobotOutlined, SendOutlined, PlusOutlined
} from '@ant-design/icons';
import TestResultDisplay from '../components/TestResultDisplay';
import MarkdownRenderer from '../components/MarkdownRenderer';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 预定义的API URL选项
const predefinedApiUrls = [
  { label: 'OpenAI', value: 'https://api.openai.com/v1' },
  { label: 'Azure OpenAI', value: 'https://your-resource-name.openai.azure.com' },
  { label: 'Anthropic', value: 'https://api.anthropic.com' },
  { label: '百度文心', value: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop' },
  { label: '智谱AI', value: 'https://open.bigmodel.cn/api/paas/v3' },
  { label: '阿里云', value: 'https://dashscope.aliyuncs.com/api/v1' },
];

const ModelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, hasRole } = useAuth();
  const [form] = Form.useForm();
  
  // 基础状态变量
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState(null);
  const [editing, setEditing] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [examplePreviewMode, setExamplePreviewMode] = useState(false);
  const [descriptionPreviewMode, setDescriptionPreviewMode] = useState(true);
  const [selectedApiUrl, setSelectedApiUrl] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState(true);
  
  // 媒体相关状态变量
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  const isNew = id === 'new';

  // 在组件加载时获取模型信息
  useEffect(() => {
    if (!isNew) {
      fetchModel();
    } else {
      setEditing(true);
    }
  }, [id]);

  // API URL选择处理
  const handleApiUrlChange = (value) => {
    setSelectedApiUrl(value);
    setCustomApiUrl(value === '');
    if (value !== '') {
      form.setFieldsValue({ access_url: value });
    }
  };
  
  // 模型类型变更处理
  const handleModelTypeChange = (value) => {
    // 清空文件列表和相关状态
    setFileList([]);
    if (previewImage) {
      revokePreviewUrl(previewImage);
      setPreviewImage('');
    }
  };

  // 获取模型信息
  const fetchModel = async () => {
    setLoading(true);
    try {
      const data = await modelsAPI.getById(id);
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
    } catch (error) {
      message.error('获取模型信息失败');
      navigate('/models');
    } finally {
      setLoading(false);
    }
  };

  // 保存模型信息
  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (isNew) {
        const data = await modelsAPI.create(values);
        message.success('模型创建成功');
        navigate(`/models/${data.id}`);
      } else {
        const data = await modelsAPI.update(id, values);
        message.success('模型更新成功');
        setModel(data);
        setEditing(false);
      }
    } catch (error) {
      message.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 处理测试请求
  const handleTest = async () => {
    if (!testInput.trim() && fileList.length === 0) {
      message.warning('请输入测试内容或上传媒体文件');
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
  
    setTesting(true);
    setIsStreaming(true);
    setTestOutput('');
  
    try {
      // 构建模型信息对象
      const modelInfo = {
        accessUrl,
        accessKey,
        modelName
      };
      
      if (modelType === 'image') {
        // 图像生成模型测试
        const { handleImageGenerationTest } = await import('../services/imageGenerationService');
        await handleImageGenerationTest(
          testInput,
          systemPrompt,
          modelInfo,
          setTestOutput,
          setIsStreaming
        );
      } else if (fileList.length > 0 && modelType === 'multimodal') {
        // 多模态测试
        const file = fileList[0].originFileObj;
        const mediaType = getMediaType(file);
        await handleMultimodalTest(
          testInput, 
          systemPrompt, 
          file, 
          mediaType, 
          modelInfo, 
          setTestOutput, 
          setIsStreaming
        );
      } else {
        // 文本测试
        await handleTextTest(
          testInput, 
          systemPrompt, 
          modelInfo, 
          setTestOutput, 
          setIsStreaming
        );
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

  // 文件上传相关处理函数
  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await createPreviewUrl(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
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
            <Card title="模型测试" style={{ height: 'fit-content' }} headStyle={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <Text strong>System Prompt：</Text>
                <TextArea
                  rows={3}
                  placeholder="输入system-prompt（可选）..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  style={{ marginTop: '8px', marginBottom: '16px' }}
                />
                
                <Text strong>测试输入：</Text>
                <TextArea
                  rows={4}
                  placeholder="请输入测试内容..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  style={{ marginTop: '8px' }}
                />
                
                {/* 添加多模态文件上传区域 */}
                {form.getFieldValue('model_type') === 'multimodal' && (
                  <div style={{ marginTop: '16px' }}>
                    <Text strong>多模态文件上传：</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onPreview={handlePreview}
                        onChange={handleFileChange}
                        beforeUpload={validateMediaFile}
                        maxCount={1}
                      >
                        {fileList.length >= 1 ? null : (
                          <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>上传</div>
                          </div>
                        )}
                      </Upload>
                      <Modal
                        open={previewOpen}
                        title={previewTitle}
                        footer={null}
                        onCancel={() => setPreviewOpen(false)}
                      >
                        {previewImage.startsWith('data:image/') ? (
                          <img alt="预览图片" style={{ width: '100%' }} src={previewImage} />
                        ) : (
                          <video 
                            controls 
                            style={{ width: '100%' }} 
                            src={previewImage}
                          >
                            您的浏览器不支持视频标签
                          </video>
                        )}
                      </Modal>
                    </div>
                  </div>
                )}
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
        <Col xs={24} lg={!isNew ? 16 : 24}>
          <Card 
            title="模型信息"
            headStyle={{ textAlign: 'left' }}
            extra={
              !isNew && hasRole(['admin', 'developer']) && (
                <Space>
                  {!editing ? (
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />}
                      onClick={() => setEditing(true)}
                    >
                      编辑
                    </Button>
                  ) : null}
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      // 删除确认逻辑可以在这里实现
                    }}
                  >
                    删除
                  </Button>
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
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="模型名称"
                    name="name"
                    rules={[{ required: true, message: '请输入模型名称' }]}
                  >
                    <Input placeholder="请输入模型名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="模型类型"
                    name="model_type"
                    rules={[{ required: true, message: '请选择模型类型' }]}
                  >
                    <Select 
                      placeholder="请选择模型类型"
                      onChange={handleModelTypeChange}
                    >
                      <Option value="text">文本模型</Option>
                      <Option value="image">图像生成模型</Option>
                      <Option value="video">视频生成模型</Option>
                      <Option value="asr">音频识别-ASR</Option>
                      <Option value="tts">语音合成-TTS</Option>
                      <Option value="embedding">嵌入模型-emb</Option>
                      <Option value="rerank">排序模型-rerank</Option>
                      <Option value="audio">Audio模型</Option>
                      <Option value="world">世界模型</Option>
                      <Option value="autonomous_driving">自动驾驶模型</Option>
                      <Option value="multimodal">多模态模型</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="发布机构"
                    name="publisher"
                  >
                    <Input placeholder="请输入发布机构" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Model Name"
                    name="model_name"
                    rules={[{ required: true, message: '请输入模型的Model Name' }]}
                  >
                    <Input placeholder="请输入API中使用的模型名称，例如：gpt-4-turbo" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item
                    label="API URL类型"
                  >
                    <Select
                      value={selectedApiUrl}
                      onChange={handleApiUrlChange}
                      style={{ width: '100%' }}
                      placeholder="选择API类型或自定义"
                    >
                      {predefinedApiUrls.map((item) => (
                        <Option key={item.value} value={item.value}>
                          {item.label}
                        </Option>
                      ))}
                      <Option value="">自定义</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item
                    label="API URL"
                    name="access_url"
                    rules={[{ required: true, message: '请输入API URL' }]}
                  >
                    <Input 
                      placeholder="请输入API URL"
                      disabled={!customApiUrl}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item
                    label="API Key"
                    name="access_key"
                    rules={[{ required: true, message: '请输入API Key' }]}
                  >
                    <Input.Password placeholder="请输入API Key" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                label="模型描述"
                name="description"
              >
                {editing || isNew ? (
                  <div style={{ position: 'relative' }}>
                    {!descriptionPreviewMode ? (
                      <TextArea 
                        rows={4} 
                        placeholder="描述模型的功能和特点（支持Markdown语法）"
                      />
                    ) : (
                      <MarkdownRenderer
                        content={form.getFieldValue('description') || ''}
                        isStreaming={false}
                      />
                    )}
                    <Button
                      onClick={() => setDescriptionPreviewMode(!descriptionPreviewMode)}
                      size="small"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        zIndex: 1
                      }}
                    >
                      {descriptionPreviewMode ? '编辑' : '预览'}
                    </Button>
                  </div>
                ) : (
                  <MarkdownRenderer
                    content={form.getFieldValue('description') || ''}
                    isStreaming={false}
                  />
                )}
              </Form.Item>
              
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
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
                <Col xs={24} sm={12}>
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
                <div style={{ position: 'relative' }}>
                  {!examplePreviewMode ? (
                    <TextArea 
                      rows={4} 
                      placeholder="提供模型使用的具体示例（支持Markdown语法）"
                    />
                  ) : (
                    <MarkdownRenderer
                      content={form.getFieldValue('example') || ''}
                      isStreaming={false}
                    />
                  )}
                  <Button
                    onClick={() => setExamplePreviewMode(!examplePreviewMode)}
                    size="small"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      zIndex: 1
                    }}
                  >
                    {examplePreviewMode ? '编辑' : '预览'}
                  </Button>
                </div>
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