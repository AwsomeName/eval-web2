import React from 'react';
import { Typography, Input, Upload, Button, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { validateMediaFile } from '../utils/mediaUtils';
import { validateAudioFile } from '../services/asrTestService';

const { Text } = Typography;
const { TextArea } = Input;

const ModelTestInputs = ({
  modelType,
  testInput,
  setTestInput,
  systemPrompt,
  setSystemPrompt,
  rerankQuery,
  setRerankQuery,
  rerankDocuments,
  setRerankDocuments,
  fileList,
  handleFileChange,
  handlePreview,
  previewOpen,
  setPreviewOpen,
  previewImage,
  previewTitle
}) => {
  return (
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
        placeholder={
          modelType === 'asr' 
            ? "ASR模型测试主要依赖音频文件，此处可留空..." 
            : modelType === 'embedding'
            ? "请输入要生成向量的文本内容..."
            : "请输入测试内容..."
        }
        value={testInput}
        onChange={(e) => setTestInput(e.target.value)}
        style={{ marginTop: '8px' }}
      />
      
      {/* 多模态文件上传区域 */}
      {modelType === 'multimodal' && (
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
      
      {/* Rerank模型输入区域 */}
      {modelType === 'rerank' && (
        <div style={{ marginTop: '16px' }}>
          <Text strong>查询文本：</Text>
          <Input
            placeholder="请输入查询文本..."
            value={rerankQuery}
            onChange={(e) => setRerankQuery(e.target.value)}
            style={{ marginTop: '8px', marginBottom: '16px' }}
          />
          
          <Text strong>文档列表：</Text>
          <TextArea
            rows={6}
            placeholder="请输入文档列表，每行一个文档..."
            value={rerankDocuments}
            onChange={(e) => setRerankDocuments(e.target.value)}
            style={{ marginTop: '8px' }}
          />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            提示：每行输入一个文档，系统会自动将其转换为数组格式
          </div>
        </div>
      )}
      
      {/* ASR音频文件上传区域 */}
      {modelType === 'asr' && (
        <div style={{ marginTop: '16px' }}>
          <Text strong>音频文件上传：</Text>
          <div style={{ marginTop: '8px' }}>
            <Upload
              listType="text"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={(file) => {
                const isValid = validateAudioFile(file);
                return isValid ? false : Upload.LIST_IGNORE;
              }}
              maxCount={1}
              accept="audio/*"
            >
              {fileList.length >= 1 ? null : (
                <Button icon={<PlusOutlined />}>
                  上传音频文件
                </Button>
              )}
            </Upload>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              支持格式：MP3、WAV、FLAC、AAC、OGG、WebM、M4A（最大25MB）
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelTestInputs;