'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Typography, 
  message, 
  Table,
  Space,
  Spin,
  Alert,
  Input,
  Modal,
  Form
} from 'antd';
import {
  PlayCircleOutlined,
  SaveOutlined,
  HistoryOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { DatabaseConnection, SavedQuery, QueryResult } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function QueryPage() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConnections();
    fetchSavedQueries();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.filter((conn: DatabaseConnection) => conn.is_active));
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      message.error('Failed to fetch connections');
    }
  };

  const fetchSavedQueries = async () => {
    try {
      const response = await fetch('/api/queries');
      if (response.ok) {
        const data = await response.json();
        setSavedQueries(data);
      }
    } catch (error) {
      console.error('Error fetching saved queries:', error);
    }
  };

  const executeQuery = async () => {
    if (!selectedConnection || !sqlQuery.trim()) {
      message.warning('Please select a connection and enter a SQL query');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/query/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: selectedConnection,
          query: sqlQuery,
        }),
      });

      const result = await response.json();
      setQueryResult(result);

      if (result.success) {
        message.success(`Query executed successfully in ${result.executionTime}ms`);
      } else {
        message.error(`Query failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing query:', error);
      message.error('Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const saveQuery = async (values: any) => {
    try {
      const response = await fetch('/api/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          sql_query: sqlQuery,
          connection_id: selectedConnection,
        }),
      });

      if (response.ok) {
        message.success('Query saved successfully');
        setSaveModalVisible(false);
        fetchSavedQueries();
        form.resetFields();
      } else {
        message.error('Failed to save query');
      }
    } catch (error) {
      console.error('Error saving query:', error);
      message.error('Failed to save query');
    }
  };

  const loadSavedQuery = (query: SavedQuery) => {
    setSqlQuery(query.sql_query);
    setSelectedConnection(query.connection_id);
    message.success('Query loaded');
  };

  const generateTableColumns = () => {
    if (!queryResult?.columns) return [];
    
    return queryResult.columns.map(col => ({
      title: col,
      dataIndex: col,
      key: col,
      render: (value: any) => {
        if (value === null || value === undefined) return <Text type="secondary">NULL</Text>;
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }
    }));
  };

  const sampleQueries = [
    'SELECT * FROM users LIMIT 10;',
    'SELECT COUNT(*) FROM users;',
    'SELECT * FROM users WHERE created_at > NOW() - INTERVAL \'7 days\';',
    'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';',
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          SQL Query Interface
        </Title>
        <Text type="secondary">
          Execute custom SQL queries on your databases
        </Text>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <Space size="large" wrap>
          <div>
            <Text strong>Database Connection:</Text>
            <Select
              style={{ width: 200, marginLeft: 8 }}
              placeholder="Select connection"
              value={selectedConnection}
              onChange={setSelectedConnection}
            >
              {connections.map(conn => (
                <Option key={conn.id} value={conn.id!}>
                  <Space>
                    <img src="/favicon.svg" alt="Database" style={{ width: '14px', height: '14px' }} />
                    {conn.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>Sample Queries:</Text>
            <Select
              style={{ width: 300, marginLeft: 8 }}
              placeholder="Load sample query"
              onChange={(value) => setSqlQuery(value)}
            >
              {sampleQueries.map((query, index) => (
                <Option key={index} value={query}>
                  {query.substring(0, 50)}...
                </Option>
              ))}
            </Select>
          </div>

          {savedQueries.length > 0 && (
            <div>
              <Text strong>Saved Queries:</Text>
              <Select
                style={{ width: 200, marginLeft: 8 }}
                placeholder="Load saved query"
                onChange={(value) => {
                  const query = savedQueries.find(q => q.id === value);
                  if (query) loadSavedQuery(query);
                }}
              >
                {savedQueries.map(query => (
                  <Option key={query.id} value={query.id!}>
                    {query.name}
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </Space>
      </Card>

      <Card 
        title="SQL Query Editor"
        extra={
          <Space>
            <Button
              icon={<SaveOutlined />}
              onClick={() => setSaveModalVisible(true)}
              disabled={!sqlQuery.trim()}
            >
              Save Query
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={executeQuery}
              loading={loading}
              disabled={!selectedConnection || !sqlQuery.trim()}
            >
              Execute Query
            </Button>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <TextArea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          placeholder="Enter your SQL query here..."
          rows={8}
          style={{ 
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '14px'
          }}
        />
      </Card>

      {queryResult && (
        <Card 
          title={
            <Space>
              <CodeOutlined />
              Query Results
              {queryResult.success && (
                <Text type="secondary">
                  ({queryResult.rowCount} rows, {queryResult.executionTime}ms)
                </Text>
              )}
            </Space>
          }
        >
          {queryResult.success ? (
            queryResult.data && queryResult.data.length > 0 ? (
              <Table
                columns={generateTableColumns()}
                dataSource={queryResult.data}
                rowKey={(record, index) => index || 0}
                pagination={{
                  pageSize: 50,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `Total ${total} rows`,
                }}
                scroll={{ x: true }}
                size="small"
              />
            ) : (
              <Alert
                message="Query executed successfully"
                description="No rows returned"
                type="success"
                showIcon
              />
            )
          ) : (
            <Alert
              message="Query Error"
              description={queryResult.error}
              type="error"
              showIcon
            />
          )}
        </Card>
      )}

      <Modal
        title="Save Query"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveQuery}
        >
          <Form.Item
            name="name"
            label="Query Name"
            rules={[{ required: true, message: 'Please enter a query name' }]}
          >
            <Input placeholder="My Query" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              placeholder="Optional description of what this query does"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="is_public"
            label="Make Public"
            valuePropName="checked"
          >
            <input type="checkbox" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSaveModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Save Query
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}