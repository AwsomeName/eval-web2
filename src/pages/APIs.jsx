import React, { useState } from 'react';
import { Card, Row, Col, Button, Typography, Tag, Space, Input, Select, Divider, message } from 'antd';
import { SearchOutlined, ApiOutlined, PlayCircleOutlined, CopyOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const APIs = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 常用API列表
  const apiList = [
    {
      id: 1,
      name: '搜索API',
      description: '提供全网搜索功能，支持多种搜索引擎',
      category: 'search',
      endpoint: '/api/search',
      method: 'POST',
      tags: ['搜索', '实时'],
      example: {
        request: {
          query: '人工智能最新发展',
          engine: 'google',
          limit: 10
        },
        response: {
          results: [
            {
              title: 'AI最新发展趋势',
              url: 'https://example.com',
              snippet: '人工智能技术正在快速发展...'
            }
          ]
        }
      }
    },
    {
      id: 2,
      name: '流式ASR API',
      description: '实时语音识别服务，支持多种语言和方言',
      category: 'speech',
      endpoint: '/api/asr/stream',
      method: 'WebSocket',
      tags: ['语音识别', '实时', '流式'],
      example: {
        request: {
          audio_format: 'wav',
          sample_rate: 16000,
          language: 'zh-CN'
        },
        response: {
          text: '你好，这是语音识别的结果',
          confidence: 0.95,
          is_final: true
        }
      }
    },
    {
      id: 3,
      name: '流式TTS API',
      description: '文本转语音服务，支持多种音色和语言',
      category: 'speech',
      endpoint: '/api/tts/stream',
      method: 'WebSocket',
      tags: ['语音合成', '实时', '流式'],
      example: {
        request: {
          text: '你好，欢迎使用TTS服务',
          voice: 'xiaoxiao',
          speed: 1.0,
          format: 'mp3'
        },
        response: {
          audio_data: 'base64_encoded_audio',
          duration: 2.5
        }
      }
    },
    {
      id: 4,
      name: '流式对话API',
      description: '智能对话服务，支持上下文理解和多轮对话',
      category: 'chat',
      endpoint: '/api/chat/stream',
      method: 'POST',
      tags: ['对话', 'AI', '流式'],
      example: {
        request: {
          messages: [
            { role: 'user', content: '你好，请介绍一下人工智能' }
          ],
          model: 'gpt-3.5-turbo',
          stream: true
        },
        response: {
          choices: [{
            delta: {
              content: '人工智能是一门综合性学科...'
            }
          }]
        }
      }
    },
    {
      id: 5,
      name: '图像生成API',
      description: '基于文本描述生成高质量图像',
      category: 'image',
      endpoint: '/api/image/generate',
      method: 'POST',
      tags: ['图像生成', 'AI', '创作'],
      example: {
        request: {
          prompt: '一只可爱的小猫在花园里玩耍',
          size: '1024x1024',
          quality: 'hd'
        },
        response: {
          image_url: 'https://example.com/generated_image.jpg',
          revised_prompt: '一只可爱的橘色小猫在绿色花园里快乐地玩耍'
        }
      }
    },
    {
      id: 6,
      name: '文档解析API',
      description: '解析各种格式文档，提取文本和结构化信息',
      category: 'document',
      endpoint: '/api/document/parse',
      method: 'POST',
      tags: ['文档解析', 'OCR', '结构化'],
      example: {
        request: {
          file_url: 'https://example.com/document.pdf',
          extract_tables: true,
          extract_images: true
        },
        response: {
          text: '文档的文本内容...',
          tables: [],
          images: [],
          metadata: {
            pages: 10,
            format: 'pdf'
          }
        }
      }
    },
    {
      id: 7,
      name: '视频生成API',
      description: '基于文本描述生成高质量视频内容',
      category: 'video',
      endpoint: '/api/video/generate',
      method: 'POST',
      tags: ['视频生成', 'AI', '创作'],
      example: {
        request: {
          prompt: '一只小鸟在蓝天白云下自由飞翔',
          duration: 10,
          resolution: '1920x1080',
          fps: 30
        },
        response: {
          video_url: 'https://example.com/generated_video.mp4',
          thumbnail_url: 'https://example.com/thumbnail.jpg',
          duration: 10.5
        }
      }
    },
    {
      id: 8,
      name: '重排序API',
      description: '对搜索结果进行智能重排序，提升相关性',
      category: 'search',
      endpoint: '/api/rerank',
      method: 'POST',
      tags: ['重排序', '搜索优化', 'AI'],
      example: {
        request: {
          query: '机器学习算法',
          documents: [
            { id: '1', text: '深度学习是机器学习的一个分支...' },
            { id: '2', text: '支持向量机是经典的机器学习算法...' }
          ]
        },
        response: {
          results: [
            { id: '2', score: 0.95, rank: 1 },
            { id: '1', score: 0.87, rank: 2 }
          ]
        }
      }
    },
    {
      id: 9,
      name: '代码生成API',
      description: '基于自然语言描述生成代码',
      category: 'code',
      endpoint: '/api/code/generate',
      method: 'POST',
      tags: ['代码生成', 'AI', '编程助手'],
      example: {
        request: {
          description: '创建一个计算斐波那契数列的Python函数',
          language: 'python',
          style: 'clean'
        },
        response: {
          code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)',
          explanation: '这是一个递归实现的斐波那契函数'
        }
      }
    },
    {
      id: 10,
      name: '翻译API',
      description: '多语言文本翻译服务，支持100+语言',
      category: 'translation',
      endpoint: '/api/translate',
      method: 'POST',
      tags: ['翻译', '多语言', 'NLP'],
      example: {
        request: {
          text: 'Hello, how are you?',
          source_lang: 'en',
          target_lang: 'zh-CN'
        },
        response: {
          translated_text: '你好，你好吗？',
          confidence: 0.98,
          detected_lang: 'en'
        }
      }
    }
  ];

  const categories = [
    { value: 'all', label: '全部' },
    { value: 'search', label: '搜索' },
    { value: 'speech', label: '语音' },
    { value: 'chat', label: '对话' },
    { value: 'image', label: '图像' },
    { value: 'video', label: '视频' },
    { value: 'document', label: '文档' },
    { value: 'code', label: '代码' },
    { value: 'translation', label: '翻译' }
  ];

  // 过滤API列表
  const filteredAPIs = apiList.filter(api => {
    const matchesSearch = api.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         api.description.toLowerCase().includes(searchText.toLowerCase()) ||
                         api.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || api.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyEndpoint = (endpoint) => {
    navigator.clipboard.writeText(endpoint);
    message.success('API端点已复制到剪贴板');
  };

  const handleTestAPI = (api) => {
    message.info(`正在测试 ${api.name}...`);
    // 这里可以添加实际的API测试逻辑
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <ApiOutlined style={{ marginRight: 8 }} />
          API 接口库
        </Title>
        <Paragraph type="secondary">
          提供常用的API接口，包括搜索、语音、对话、图像等多种服务
        </Paragraph>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="搜索API名称、描述或标签"
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              size="large"
              style={{ width: 120 }}
            >
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* API列表 */}
      <Row gutter={[16, 16]}>
        {filteredAPIs.map(api => (
          <Col xs={24} lg={12} xl={8} key={api.id}>
            <Card
              title={
                <Space>
                  <ApiOutlined />
                  <span>{api.name}</span>
                  <Tag color={api.method === 'WebSocket' ? 'purple' : 'blue'}>
                    {api.method}
                  </Tag>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyEndpoint(api.endpoint)}
                    title="复制端点"
                  />
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleTestAPI(api)}
                  >
                    测试
                  </Button>
                </Space>
              }
              hoverable
            >
              <div style={{ marginBottom: 16 }}>
                <Text>{api.description}</Text>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <Text strong>端点：</Text>
                <Text code>{api.endpoint}</Text>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Space wrap>
                  {api.tags.map(tag => (
                    <Tag key={tag} color="geekblue">{tag}</Tag>
                  ))}
                </Space>
              </div>

              <Divider style={{ margin: '12px 0' }} />
              
              <div>
                <Text strong style={{ fontSize: '12px' }}>请求示例：</Text>
                <pre style={{ 
                  fontSize: '11px', 
                  backgroundColor: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  margin: '4px 0',
                  overflow: 'auto',
                  maxHeight: '100px'
                }}>
                  {JSON.stringify(api.example.request, null, 2)}
                </pre>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredAPIs.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ApiOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <div>
              <Text type="secondary">没有找到匹配的API</Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default APIs;