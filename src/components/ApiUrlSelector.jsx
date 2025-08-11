import React from 'react';
import { Form, Select, Input, Row, Col } from 'antd';

const { Option } = Select;

const ApiUrlSelector = ({ 
  currentPredefinedApiUrls, 
  selectedApiUrl, 
  customApiUrl, 
  onApiUrlChange, 
  editing, 
  isNew 
}) => {
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item
            label="API提供商"
          >
            <Select
              placeholder="选择API提供商或自定义"
              value={selectedApiUrl}
              onChange={onApiUrlChange}
              disabled={!editing && !isNew}
            >
              {currentPredefinedApiUrls.map((item) => (
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
              disabled={!customApiUrl || (!editing && !isNew)}
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
    </>
  );
};

export default ApiUrlSelector;