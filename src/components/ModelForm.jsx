import React from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Space } from 'antd';
import { SaveOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import ApiUrlSelector from './ApiUrlSelector';
import MarkdownRenderer from './MarkdownRenderer';

const { TextArea } = Input;
const { Option } = Select;

const ModelForm = ({
  form,
  model,
  editing,
  setEditing,
  isNew,
  saving,
  handleSave,
  handleDelete,
  navigate,
  currentPredefinedApiUrls,
  selectedApiUrl,
  customApiUrl,
  handleApiUrlChange,
  handleModelTypeChange,
  descriptionPreviewMode,
  setDescriptionPreviewMode,
  examplePreviewMode,
  setExamplePreviewMode
}) => {
  const { hasRole } = useAuth();

  return (
    <Card 
      title="模型信息"
      headStyle={{ textAlign: 'left' }}
      extra={
        !isNew && !editing && hasRole(['admin', 'developer']) && (
          <Space>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => setEditing(true)}
            >
              编辑
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleDelete}
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
                <Option value="text">文本生成</Option>
                <Option value="multimodal">多模态</Option>
                <Option value="image">图像生成</Option>
                <Option value="video">视频生成</Option>
                <Option value="asr">语音识别</Option>
                <Option value="tts">语音合成</Option>
                <Option value="embedding">嵌入模型</Option>
                <Option value="rerank">重排序</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item
              label="模型名称（API调用）"
              name="model_name"
              rules={[{ required: true, message: '请输入API调用时使用的模型名称' }]}
            >
              <Input placeholder="请输入API调用时使用的模型名称，如：gpt-4" />
            </Form.Item>
          </Col>
        </Row>
        
        <ApiUrlSelector
          currentPredefinedApiUrls={currentPredefinedApiUrls}
          selectedApiUrl={selectedApiUrl}
          customApiUrl={customApiUrl}
          onApiUrlChange={handleApiUrlChange}
          editing={editing}
          isNew={isNew}
        />
        
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
  );
};

export default ModelForm;