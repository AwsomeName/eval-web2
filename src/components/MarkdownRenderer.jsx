import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Typography } from 'antd';

const { Text } = Typography;

const MarkdownRenderer = ({ content, isError = false, isStreaming = false }) => {
  // 如果是错误信息，直接显示为纯文本
  if (isError) {
    return (
      <div style={{
        color: '#ff4d4f',
        backgroundColor: '#fff2f0',
        border: '1px solid #ffccc7',
        borderRadius: '6px',
        padding: '12px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
        fontSize: '13px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {content}
      </div>
    );
  }

  // 检查内容是否包含markdown语法
  const hasMarkdownSyntax = /[#*`\[\]\(\)|_~]/.test(content) || 
                           content.includes('```') || 
                           content.includes('**') ||
                           content.includes('__') ||
                           content.includes('- ') ||
                           content.includes('1. ');

  // 如果没有markdown语法，显示为纯文本
  if (!hasMarkdownSyntax) {
    return (
      <div style={{
        backgroundColor: '#f5f5f5',
        borderRadius: '6px',
        padding: '12px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        lineHeight: '1.6',
        maxHeight: '400px',
        overflowY: 'auto',
        color: '#262626'
      }}>
        {content}
      </div>
    );
  }

  // 渲染markdown内容
  return (
    <div style={{
      backgroundColor: '#fafafa',
      borderRadius: '6px',
      padding: '16px',
      maxHeight: '400px',
      overflowY: 'auto',
      border: '1px solid #d9d9d9'
    }}>
      {isStreaming && (
        <div style={{
          marginBottom: '8px',
          padding: '4px 8px',
          backgroundColor: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#0958d9'
        }}>
          正在接收中...
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={tomorrow}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code 
                className={className} 
                style={{
                  backgroundColor: '#f0f0f0',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontSize: '0.9em',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 style={{ color: '#262626', marginTop: '0', marginBottom: '16px', fontSize: '20px' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ color: '#262626', marginTop: '16px', marginBottom: '12px', fontSize: '18px' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ color: '#262626', marginTop: '16px', marginBottom: '8px', fontSize: '16px' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ color: '#262626', lineHeight: '1.6', marginBottom: '12px' }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul style={{ color: '#262626', paddingLeft: '20px', marginBottom: '12px' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ color: '#262626', paddingLeft: '20px', marginBottom: '12px' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: '4px' }}>
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '4px solid #d9d9d9',
              paddingLeft: '16px',
              margin: '16px 0',
              color: '#595959',
              fontStyle: 'italic'
            }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              margin: '16px 0',
              border: '1px solid #d9d9d9'
            }}>
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th style={{
              border: '1px solid #d9d9d9',
              padding: '8px 12px',
              backgroundColor: '#fafafa',
              textAlign: 'left',
              fontWeight: '600'
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              border: '1px solid #d9d9d9',
              padding: '8px 12px'
            }}>
              {children}
            </td>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;