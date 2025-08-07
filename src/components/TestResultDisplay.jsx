import React, { useState, useEffect, useRef } from 'react';
import { Typography, Alert, Button, Space } from 'antd';
import { CopyOutlined, ClearOutlined, DownloadOutlined } from '@ant-design/icons';
import MarkdownRenderer from './MarkdownRenderer';

const { Text } = Typography;

const TestResultDisplay = ({ 
  output, 
  isLoading, 
  isStreaming, 
  onClear 
}) => {
  const [isError, setIsError] = useState(false);
  const [statusInfo, setStatusInfo] = useState('');
  const [actualContent, setActualContent] = useState('');
  const containerRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    if (!output) {
      setIsError(false);
      setStatusInfo('');
      setActualContent('');
      return;
    }

    // 分离状态信息和实际内容
    const lines = output.split('\n');
    let contentStartIndex = -1;
    let statusLines = [];
    
    // 查找实际响应内容的开始位置
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('开始接收响应数据') || 
          line.includes('响应状态: 200') ||
          (line.trim() === '' && i > 0 && lines[i-1].includes('开始接收响应数据'))) {
        contentStartIndex = i + 1;
        break;
      }
      statusLines.push(line);
    }

    // 检查是否是错误信息
    const errorKeywords = ['测试失败', '网络错误', '配置错误', '不支持的模型类型', 'API错误'];
    const isErrorContent = errorKeywords.some(keyword => output.includes(keyword));
    
    setIsError(isErrorContent);
    
    if (isErrorContent) {
      setActualContent(output);
      setStatusInfo('');
    } else {
      setStatusInfo(statusLines.join('\n'));
      if (contentStartIndex >= 0) {
        const content = lines.slice(contentStartIndex).join('\n').trim();
        setActualContent(content);
      } else {
        setActualContent(output);
      }
    }
  }, [output]);

  // 自动滚动到底部
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current && isStreaming) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [actualContent, isStreaming]);

  // 处理滚动事件，检测用户是否手动滚动
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      // 如果用户滚动到接近底部，则继续自动滚动
      shouldAutoScroll.current = scrollTop + clientHeight >= scrollHeight - 50;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(actualContent || output);
      // 可以添加成功提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleDownload = () => {
    const content = actualContent || output;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-result-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!output && !isLoading) {
    return (
      <div style={{
        textAlign: 'center',
        color: '#8c8c8c',
        padding: '40px 20px',
        backgroundColor: '#fafafa',
        borderRadius: '6px',
        border: '1px dashed #d9d9d9'
      }}>
        输入测试内容并点击"发送测试"开始测试
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <Text strong style={{ textAlign: 'left' }}>输出结果：</Text>
        <Space>
          {(actualContent || output) && (
            <>
              <Button 
                size="small" 
                icon={<CopyOutlined />} 
                onClick={handleCopy}
                title="复制结果"
              />
              <Button 
                size="small" 
                icon={<DownloadOutlined />} 
                onClick={handleDownload}
                title="下载结果"
              />
            </>
          )}
          {onClear && (actualContent || output) && (
            <Button 
              size="small" 
              icon={<ClearOutlined />} 
              onClick={onClear}
              title="清空结果"
            />
          )}
        </Space>
      </div>

      {isLoading && (
        <Alert
          message="正在发送请求..."
          type="info"
          showIcon
          style={{ marginBottom: '12px' }}
        />
      )}

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          maxHeight: '500px',
          overflowY: 'auto'
        }}
      >
        <MarkdownRenderer 
          content={actualContent || output}
          isError={isError}
          isStreaming={isStreaming}
        />
      </div>

      {statusInfo && !isError && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #91d5ff',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#0958d9',
          fontFamily: 'Monaco, Consolas, "Courier New", monospace'
        }}>
          {statusInfo}
        </div>
      )}

      {isStreaming && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: '#8c8c8c',
          textAlign: 'center'
        }}>
          正在接收流式响应...
        </div>
      )}
    </div>
  );
};

export default TestResultDisplay;