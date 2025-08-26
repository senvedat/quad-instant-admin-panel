'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  message, 
  Popconfirm,
  Tag,
  Typography 
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { DatabaseConnection } from '@/types';

const { Title } = Typography;

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState<DatabaseConnection | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      message.error('Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = () => {
    setEditingConnection(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditConnection = (connection: DatabaseConnection) => {
    setEditingConnection(connection);
    form.setFieldsValue({
      ...connection,
      password: '', // Don't show the actual password
    });
    setModalVisible(true);
  };

  const handleDeleteConnection = async (id: number) => {
    try {
      const response = await fetch(`/api/connections/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Connection deleted successfully');
        fetchConnections();
      } else {
        message.error('Failed to delete connection');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      message.error('Failed to delete connection');
    }
  };

  const handleTestConnection = async (connection: DatabaseConnection) => {
    setTestingConnection(connection.id || 0);
    
    try {
      const response = await fetch('/api/connections/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      });

      const result = await response.json();
      
      if (result.success) {
        message.success('Connection test successful!');
      } else {
        message.error(`Connection test failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      message.error('Failed to test connection');
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingConnection 
        ? `/api/connections/${editingConnection.id}`
        : '/api/connections';
      
      const method = editingConnection ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(
          editingConnection 
            ? 'Connection updated successfully' 
            : 'Connection added successfully'
        );
        setModalVisible(false);
        fetchConnections();
      } else {
        const error = await response.json();
        message.error(error.message || 'Failed to save connection');
      }
    } catch (error) {
      console.error('Error saving connection:', error);
      message.error('Failed to save connection');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <img src="/favicon.svg" alt="Database" style={{ width: '16px', height: '16px' }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Host',
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: 'Port',
      dataIndex: 'port',
      key: 'port',
    },
    {
      title: 'Database',
      dataIndex: 'database_name',
      key: 'database_name',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag 
          color={isActive ? 'green' : 'red'} 
          icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: DatabaseConnection) => (
        <Space>
          <Button
            size="small"
            onClick={() => handleTestConnection(record)}
            loading={testingConnection === record.id}
          >
            Test
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditConnection(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this connection?"
            onConfirm={() => handleDeleteConnection(record.id!)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Database Connections
          </Title>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddConnection}
        >
          Add Connection
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={connections}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        title={editingConnection ? 'Edit Connection' : 'Add Connection'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            port: 5432,
            is_active: true,
          }}
        >
          <Form.Item
            name="name"
            label="Connection Name"
            rules={[{ required: true, message: 'Please enter a connection name' }]}
          >
            <Input placeholder="My Database Connection" />
          </Form.Item>

          <Form.Item
            name="host"
            label="Host"
            rules={[{ required: true, message: 'Please enter the host' }]}
          >
            <Input placeholder="localhost" />
          </Form.Item>

          <Form.Item
            name="port"
            label="Port"
            rules={[{ required: true, message: 'Please enter the port' }]}
          >
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="database_name"
            label="Database Name"
            rules={[{ required: true, message: 'Please enter the database name' }]}
          >
            <Input placeholder="my_database" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter the username' }]}
          >
            <Input placeholder="postgres" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: !editingConnection, message: 'Please enter the password' }]}
          >
            <Input.Password placeholder={editingConnection ? 'Leave blank to keep current password' : 'Enter password'} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingConnection ? 'Update' : 'Add'} Connection
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}