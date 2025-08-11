import React, { useState } from 'react';
import { Card, Row, Col, Button, Typography, Tag, Space, Input, Select, Divider, message, Badge } from 'antd';
import { SearchOutlined, CloudOutlined, LinkOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const MCPs = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [connectedMCPs, setConnectedMCPs] = useState(new Set(['amap', 'baidu']));

  // 常用MCP列表
  const mcpList = [
    {
      id: 'amap',
      name: '高德地图平台',
      description: '提供地图服务、路径规划、地理编码、POI搜索等功能',
      category: 'map',
      provider: '高德软件',
      status: 'active',
      capabilities: ['地图显示', '路径规划', '地理编码', 'POI搜索', '实时交通'],
      apiEndpoint: 'https://restapi.amap.com',
      documentation: 'https://lbs.amap.com/api',
      tags: ['地图', '导航', '位置服务'],
      config: {
        apiKey: 'your_amap_api_key',
        version: 'v3',
        timeout: 5000
      },
      features: [
        '支持2D/3D地图显示',
        '实时路况信息',
        '多种出行方式规划',
        '周边POI搜索',
        '地理位置转换'
      ]
    },
    {
      id: 'baidu',
      name: '百度智能云平台',
      description: '提供AI服务、云计算、大数据分析等综合能力',
      category: 'ai',
      provider: '百度',
      status: 'active',
      capabilities: ['语音识别', '图像识别', '自然语言处理', '机器翻译', '内容审核'],
      apiEndpoint: 'https://aip.baidubce.com',
      documentation: 'https://cloud.baidu.com/doc',
      tags: ['AI', '云服务', 'NLP'],
      config: {
        apiKey: 'your_baidu_api_key',
        secretKey: 'your_baidu_secret_key',
        timeout: 10000
      },
      features: [
        '丰富的AI能力接口',
        '高精度识别服务',
        '多语言支持',
        '实时处理能力',
        '企业级安全保障'
      ]
    },
    {
      id: 'tencent',
      name: '腾讯云平台',
      description: '提供云计算、AI、音视频、游戏等多领域服务',
      category: 'cloud',
      provider: '腾讯',
      status: 'available',
      capabilities: ['云服务器', 'AI服务', '音视频处理', '游戏服务', '安全防护'],
      apiEndpoint: 'https://cvm.tencentcloudapi.com',
      documentation: 'https://cloud.tencent.com/document',
      tags: ['云计算', 'AI', '音视频'],
      config: {
        secretId: 'your_tencent_secret_id',
        secretKey: 'your_tencent_secret_key',
        region: 'ap-beijing'
      },
      features: [
        '全球化云基础设施',
        '丰富的AI算法库',
        '专业音视频解决方案',
        '游戏行业深度优化',
        '多层次安全防护'
      ]
    },
    {
      id: 'aliyun',
      name: '阿里云平台',
      description: '提供云计算、大数据、AI、安全等全栈云服务',
      category: 'cloud',
      provider: '阿里巴巴',
      status: 'available',
      capabilities: ['云计算', '大数据', 'AI服务', '安全服务', '中间件'],
      apiEndpoint: 'https://ecs.aliyuncs.com',
      documentation: 'https://help.aliyun.com',
      tags: ['云计算', '大数据', 'AI'],
      config: {
        accessKeyId: 'your_aliyun_access_key_id',
        accessKeySecret: 'your_aliyun_access_key_secret',
        regionId: 'cn-hangzhou'
      },
      features: [
        '领先的云计算技术',
        '完整的大数据解决方案',
        '丰富的AI算法服务',
        '企业级安全保障',
        '全球化服务网络'
      ]
    },
    {
      id: 'wechat',
      name: '微信开放平台',
      description: '提供微信生态内的各种开发能力和服务',
      category: 'social',
      provider: '腾讯',
      status: 'available',
      capabilities: ['用户授权', '消息推送', '支付服务', '小程序', '公众号'],
      apiEndpoint: 'https://api.weixin.qq.com',
      documentation: 'https://developers.weixin.qq.com',
      tags: ['社交', '支付', '小程序'],
      config: {
        appId: 'your_wechat_app_id',
        appSecret: 'your_wechat_app_secret',
        mchId: 'your_merchant_id'
      },
      features: [
        '庞大的用户基础',
        '完整的支付体系',
        '丰富的社交功能',
        '小程序生态',
        '企业微信集成'
      ]
    },
    {
      id: 'github',
      name: 'GitHub平台',
      description: '提供代码托管、协作开发、CI/CD等开发者服务',
      category: 'development',
      provider: 'Microsoft',
      status: 'available',
      capabilities: ['代码托管', '版本控制', 'CI/CD', '项目管理', '社区协作'],
      apiEndpoint: 'https://api.github.com',
      documentation: 'https://docs.github.com',
      tags: ['开发', '代码托管', '协作'],
      config: {
        token: 'your_github_token',
        username: 'your_github_username',
        organization: 'your_organization'
      },
      features: [
        '全球最大代码托管平台',
        '强大的协作功能',
        '完整的CI/CD流程',
        '丰富的开源生态',
        '专业的项目管理工具'
      ]
    },
    {
      id: 'slack',
      name: 'Slack工作空间',
      description: '团队协作和沟通平台，提供消息、文件共享、集成等功能',
      category: 'collaboration',
      provider: 'Slack Technologies',
      status: 'available',
      capabilities: ['即时消息', '文件共享', '视频会议', '应用集成', '工作流自动化'],
      apiEndpoint: 'https://slack.com/api',
      documentation: 'https://api.slack.com',
      tags: ['协作', '沟通', '团队'],
      config: {
        botToken: 'xoxb-your-bot-token',
        appToken: 'xapp-your-app-token',
        signingSecret: 'your-signing-secret'
      },
      features: [
        '实时消息和通知',
        '丰富的应用生态',
        '强大的搜索功能',
        '自定义工作流',
        '企业级安全保障'
      ]
    },
    {
      id: 'notion',
      name: 'Notion工作空间',
      description: '一体化工作空间，集成笔记、数据库、项目管理等功能',
      category: 'productivity',
      provider: 'Notion Labs',
      status: 'available',
      capabilities: ['文档编辑', '数据库管理', '项目跟踪', '知识管理', '团队协作'],
      apiEndpoint: 'https://api.notion.com',
      documentation: 'https://developers.notion.com',
      tags: ['笔记', '数据库', '项目管理'],
      config: {
        integrationToken: 'secret_your-integration-token',
        databaseId: 'your-database-id',
        version: '2022-06-28'
      },
      features: [
        '灵活的页面结构',
        '强大的数据库功能',
        '丰富的内容类型',
        '实时协作编辑',
        '模板和自动化'
      ]
    },
    {
      id: 'stripe',
      name: 'Stripe支付平台',
      description: '在线支付处理平台，支持全球支付和订阅管理',
      category: 'payment',
      provider: 'Stripe',
      status: 'available',
      capabilities: ['在线支付', '订阅管理', '发票系统', '欺诈检测', '财务报告'],
      apiEndpoint: 'https://api.stripe.com',
      documentation: 'https://stripe.com/docs/api',
      tags: ['支付', '订阅', '电商'],
      config: {
        publishableKey: 'pk_test_your-publishable-key',
        secretKey: 'sk_test_your-secret-key',
        webhookSecret: 'whsec_your-webhook-secret'
      },
      features: [
        '全球支付支持',
        '灵活的定价模型',
        '强大的API接口',
        '实时欺诈检测',
        '详细的分析报告'
      ]
    }
  ];

  const categories = [
    { value: 'all', label: '全部' },
    { value: 'map', label: '地图服务' },
    { value: 'ai', label: 'AI服务' },
    { value: 'cloud', label: '云服务' },
    { value: 'social', label: '社交平台' },
    { value: 'development', label: '开发工具' },
    { value: 'collaboration', label: '协作工具' },
    { value: 'productivity', label: '生产力工具' },
    { value: 'payment', label: '支付服务' }
  ];

  // 过滤MCP列表
  const filteredMCPs = mcpList.filter(mcp => {
    const matchesSearch = mcp.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         mcp.description.toLowerCase().includes(searchText.toLowerCase()) ||
                         mcp.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || mcp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConnect = (mcpId) => {
    const newConnected = new Set(connectedMCPs);
    if (newConnected.has(mcpId)) {
      newConnected.delete(mcpId);
      message.success('MCP连接已断开');
    } else {
      newConnected.add(mcpId);
      message.success('MCP连接成功');
    }
    setConnectedMCPs(newConnected);
  };

  const handleConfigure = (mcp) => {
    message.info(`正在配置 ${mcp.name}...`);
    // 这里可以添加实际的配置逻辑
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'available': return 'processing';
      case 'maintenance': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '运行中';
      case 'available': return '可用';
      case 'maintenance': return '维护中';
      case 'error': return '错误';
      default: return '未知';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <CloudOutlined style={{ marginRight: 8 }} />
          MCP 服务平台
        </Title>
        <Paragraph type="secondary">
          集成常用的第三方服务平台，包括地图、AI、云服务、社交等多种MCP连接
        </Paragraph>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="搜索MCP名称、描述或标签"
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

      {/* MCP列表 */}
      <Row gutter={[16, 16]}>
        {filteredMCPs.map(mcp => (
          <Col xs={24} lg={12} xl={8} key={mcp.id}>
            <Card
              title={
                <Space>
                  <CloudOutlined />
                  <span>{mcp.name}</span>
                  <Badge 
                    status={getStatusColor(mcp.status)} 
                    text={getStatusText(mcp.status)}
                  />
                </Space>
              }
              extra={
                <Space>
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    onClick={() => handleConfigure(mcp)}
                    title="配置"
                  />
                  <Button
                    type={connectedMCPs.has(mcp.id) ? 'default' : 'primary'}
                    size="small"
                    icon={connectedMCPs.has(mcp.id) ? <CheckCircleOutlined /> : <LinkOutlined />}
                    onClick={() => handleConnect(mcp.id)}
                  >
                    {connectedMCPs.has(mcp.id) ? '已连接' : '连接'}
                  </Button>
                </Space>
              }
              hoverable
            >
              <div style={{ marginBottom: 16 }}>
                <Text>{mcp.description}</Text>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <Text strong>提供商：</Text>
                <Text>{mcp.provider}</Text>
              </div>

              <div style={{ marginBottom: 12 }}>
                <Text strong>API端点：</Text>
                <Text code style={{ fontSize: '11px' }}>{mcp.apiEndpoint}</Text>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Space wrap>
                  {mcp.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </div>

              <Divider style={{ margin: '12px 0' }} />
              
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: '12px' }}>核心能力：</Text>
                <div style={{ marginTop: 4 }}>
                  {mcp.capabilities.slice(0, 3).map(capability => (
                    <Tag key={capability} size="small" color="geekblue">
                      {capability}
                    </Tag>
                  ))}
                  {mcp.capabilities.length > 3 && (
                    <Tag size="small" color="default">
                      +{mcp.capabilities.length - 3}
                    </Tag>
                  )}
                </div>
              </div>

              <div>
                <Text strong style={{ fontSize: '12px' }}>主要特性：</Text>
                <ul style={{ 
                  fontSize: '11px', 
                  margin: '4px 0 0 0', 
                  paddingLeft: '16px',
                  color: '#666'
                }}>
                  {mcp.features.slice(0, 3).map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                  {mcp.features.length > 3 && (
                    <li>...</li>
                  )}
                </ul>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredMCPs.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CloudOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <div>
              <Text type="secondary">没有找到匹配的MCP服务</Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MCPs;