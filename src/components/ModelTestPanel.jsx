import React from 'react';
import { Card, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import ModelTestInputs from './ModelTestInputs';
import TestResultDisplay from './TestResultDisplay';

const ModelTestPanel = ({
  form,
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
  previewTitle,
  testing,
  handleTest,
  testOutput,
  setTestOutput,
  isStreaming,
  handleStopRequest
}) => {
  const modelType = form.getFieldValue('model_type');

  return (
    <Card title="模型测试" style={{ height: 'fit-content' }} headStyle={{ textAlign: 'left' }}>
      <ModelTestInputs
        modelType={modelType}
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
      />
      
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
            isLoading={testing && !testOutput}
            isStreaming={isStreaming}
            onClear={() => setTestOutput('')}
            onStop={handleStopRequest}
          />
        </div>
      </div>
    </Card>
  );
};

export default ModelTestPanel;