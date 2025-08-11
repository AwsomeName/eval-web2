import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { modelsAPI } from '../utils/api';
import { getMediaType, createPreviewUrl, revokePreviewUrl } from '../utils/mediaUtils';
import { handleTextTest, handleMultimodalTest } from '../services/modelTestService';
import { handleASRTest, validateAudioFile } from '../services/asrTestService';
import { handleTTSTest, validateTTSText } from '../services/ttsService';
import { handleRerankTest, validateRerankParams } from '../services/rerankTestService';
import { handleEmbeddingTest, validateEmbeddingParams } from '../services/embeddingTestService';
import { getPredefinedApiUrls, predefinedApiUrls } from '../utils/modelApiUrls';
// 注意：handleImageGenerationTest使用动态导入，无需在这里添加静态导入
import {
  Form, Button, Row, Col, Typography, 
  message
} from 'antd';
import {
  ArrowLeftOutlined, RobotOutlined
} from '@ant-design/icons';
import ModelTestPanel from '../components/ModelTestPanel';
import ModelForm from '../components/ModelForm';

const { Title } = Typography;

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
  // 添加缺失的状态变量
  const [abortController, setAbortController] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [examplePreviewMode, setExamplePreviewMode] = useState(false);
  const [descriptionPreviewMode, setDescriptionPreviewMode] = useState(false);
  const [selectedApiUrl, setSelectedApiUrl] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState(true);
  const [currentModelType, setCurrentModelType] = useState('text');
  const [currentPredefinedApiUrls, setCurrentPredefinedApiUrls] = useState(predefinedApiUrls);
  
  // 媒体相关状态变量
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  // Rerank模型相关状态变量
  const [rerankQuery, setRerankQuery] = useState('');
  const [rerankDocuments, setRerankDocuments] = useState('');
  
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
    
    // 更新当前模型类型
    setCurrentModelType(value);
    
    // 根据新的模型类型更新API URL选项
    const newApiUrls = getPredefinedApiUrls(value);
    setCurrentPredefinedApiUrls(newApiUrls);
    
    // 如果当前选择的是硅基流动，需要更新URL
    if (selectedApiUrl && selectedApiUrl.includes('siliconflow.cn')) {
      const siliconFlowOption = newApiUrls.find(url => url.label === '硅基流动');
      if (siliconFlowOption) {
        setSelectedApiUrl(siliconFlowOption.value);
        form.setFieldsValue({ access_url: siliconFlowOption.value });
      }
    }
    
    // 清空测试输入和输出
    setTestInput('');
    setTestOutput('');
  };

  // 获取模型信息
  const fetchModel = async () => {
    setLoading(true);
    try {
      const data = await modelsAPI.getById(id);
      setModel(data);
      form.setFieldsValue(data);
      
      // 设置当前模型类型并更新API URL选项
      const modelType = data.model_type || 'text';
      setCurrentModelType(modelType);
      const apiUrls = getPredefinedApiUrls(modelType);
      setCurrentPredefinedApiUrls(apiUrls);
      
      // 设置 API URL 类型
      const predefinedUrl = apiUrls.find(item => item.value === data.access_url);
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

  // 删除模型
  const handleDelete = async () => {
    try {
      await modelsAPI.delete(id);
      message.success('模型删除成功');
      navigate('/models');
    } catch (error) {
      message.error(error.message || '删除失败');
    }
  };

  // 处理测试请求
  const handleTest = async () => {
    const currentFormValues = form.getFieldsValue();
    const modelType = currentFormValues.model_type || model?.model_type;
    
    // 根据模型类型进行不同的验证
    if (modelType === 'asr') {
      if (fileList.length === 0) {
        message.warning('ASR模型测试需要上传音频文件');
        return;
      }
    } else if (!testInput.trim() && fileList.length === 0) {
      message.warning('请输入测试内容或上传媒体文件');
      return;
    }
  
    let accessUrl = currentFormValues.access_url || model?.access_url;
    // 清理URL中的特殊字符（反引号、单引号、双引号、空格等）
    if (accessUrl) {
      accessUrl = accessUrl.trim().replace(/[`'"\s]/g, '');
    }
    let accessKey = currentFormValues.access_key || model?.access_key;
    // 清理API Key中的特殊字符（换行符、回车符、制表符、空格等）
    if (accessKey) {
      accessKey = accessKey.trim().replace(/[\r\n\t\s]/g, '');
    }
    const modelName = currentFormValues.model_name || model?.model_name;
  
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
    
    // 创建一个新的 AbortController 实例用于请求取消
    const controller = new AbortController();
    setAbortController(controller);
    
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
          setIsStreaming,
          controller.signal // 传递 signal
        );
      } else if (modelType === 'video') {
        // 视频生成模型测试
        const { handleVideoGenerationTest } = await import('../services/videoGenerationService');
        await handleVideoGenerationTest(
          testInput,
          systemPrompt,
          modelInfo,
          setTestOutput,
          setIsStreaming,
          controller.signal // 传递 signal
        );
      } else if (modelType === 'asr') {
        // ASR模型测试
        if (fileList.length === 0) {
          message.warning('ASR模型测试需要上传音频文件');
          return;
        }
        const audioFile = fileList[0].originFileObj;
        await handleASRTest(
          audioFile,
          modelInfo,
          setTestOutput,
          setIsStreaming,
          controller.signal // 传递 signal
        );
      } else if (modelType === 'tts') {
        // TTS语音合成模型测试
        if (!testInput || !testInput.trim()) {
          message.warning('TTS模型测试需要输入文本内容');
          return;
        }
        
        // 验证文本输入
        const validation = validateTTSText(testInput, true);
        if (!validation.isValid) {
          return;
        }
        
        await handleTTSTest(
          testInput,
          modelInfo,
          setTestOutput,
          setIsStreaming,
          controller.signal // 传递 signal
        );
      } else if (modelType === 'rerank') {
        // Rerank重排序模型测试
        const documents = rerankDocuments.split('\n').filter(doc => doc.trim().length > 0);
        
        // 验证rerank参数
        const validation = validateRerankParams(rerankQuery, documents);
        if (!validation.isValid) {
          message.error(validation.errors.join(', '));
          setTestOutput(`❌ 参数验证失败: ${validation.errors.join(', ')}\n`);
          return;
        }
        
        await handleRerankTest(
          modelInfo,
          rerankQuery,
          documents,
          setTestOutput,
          setTesting
        );
      } else if (modelType === 'embedding') {
        // Embedding嵌入模型测试
        if (!testInput || !testInput.trim()) {
          message.warning('Embedding模型测试需要输入文本内容');
          return;
        }
        
        // 验证embedding参数
        const validation = validateEmbeddingParams(testInput);
        if (!validation.isValid) {
          message.error(validation.errors.join(', '));
          setTestOutput(`❌ 参数验证失败: ${validation.errors.join(', ')}\n`);
          return;
        }
        
        await handleEmbeddingTest(
          modelInfo,
          testInput,
          setTestOutput,
          setTesting
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
          setIsStreaming,
          controller.signal // 传递 signal
        );
      } else {
        // 文本测试
        await handleTextTest(
          testInput, 
          systemPrompt, 
          modelInfo, 
          setTestOutput, 
          setIsStreaming,
          controller.signal // 传递 signal
        );
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setTestOutput(prev => prev + '\n\n**请求已手动停止**');
        message.info('请求已手动停止');
      } else {
        console.error('测试失败:', error);
        setIsStreaming(false);
        setTestOutput(`## 网络错误\n\n**错误信息:** ${error.message}\n\n**可能原因:**\n- 网络连接问题\n- CORS跨域限制\n- API服务不可用\n- 请求超时`);
        message.error(`网络错误: ${error.message}`);
      }
    } finally {
      setTesting(false);
      setAbortController(null);
    }
  };
  
  // 处理停止请求
  const handleStopRequest = () => {
    if (abortController) {
      abortController.abort();
      setIsStreaming(false);
      message.info('正在停止请求...');
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
          <Col xs={24} lg={10}>
            <ModelTestPanel
              form={form}
              testInput={testInput}
              setTestInput={setTestInput}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              rerankQuery={rerankQuery}
              setRerankQuery={setRerankQuery}
              rerankDocuments={rerankDocuments}
              setRerankDocuments={setRerankDocuments}
              fileList={fileList}
              handleFileChange={handleFileChange}
              handlePreview={handlePreview}
              previewOpen={previewOpen}
              setPreviewOpen={setPreviewOpen}
              previewImage={previewImage}
              previewTitle={previewTitle}
              testing={testing}
              handleTest={handleTest}
              testOutput={testOutput}
              setTestOutput={setTestOutput}
              isStreaming={isStreaming}
              handleStopRequest={handleStopRequest}
            />
          </Col>
        )}

        {/* 模型信息表单 */}
        <Col xs={24} lg={!isNew ? 14 : 24}>
          <ModelForm
            form={form}
            model={model}
            editing={editing}
            setEditing={setEditing}
            isNew={isNew}
            saving={saving}
            handleSave={handleSave}
            handleDelete={handleDelete}
            navigate={navigate}
            currentPredefinedApiUrls={currentPredefinedApiUrls}
            selectedApiUrl={selectedApiUrl}
            customApiUrl={customApiUrl}
            handleApiUrlChange={handleApiUrlChange}
            handleModelTypeChange={handleModelTypeChange}
            descriptionPreviewMode={descriptionPreviewMode}
            setDescriptionPreviewMode={setDescriptionPreviewMode}
            examplePreviewMode={examplePreviewMode}
            setExamplePreviewMode={setExamplePreviewMode}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ModelDetail;