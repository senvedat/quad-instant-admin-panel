'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Select,
  Typography,
  Divider,
  Switch,
  InputNumber,
  message,
  Alert,
  Table,
  Modal,
  Tag,
  Tooltip
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  TableOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { SavedTableView } from '@/types';

const { Title, Text } = Typography;

interface AppSettings {
  appName: string;
  maxConnections: number;
  enableLogging: boolean;
  sessionTimeout: number;
  enableTelemetry: boolean;
  defaultPageSize: number;
}

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableViewsLoading, setTableViewsLoading] = useState(false);
  const [savedTableViews, setSavedTableViews] = useState<SavedTableView[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingView, setEditingView] = useState<SavedTableView | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'Quad Admin Panel',
    maxConnections: 10,
    enableLogging: true,
    sessionTimeout: 30,
    enableTelemetry: false,
    defaultPageSize: 50
  });

  useEffect(() => {
    // Load settings from localStorage or API
    loadSettings();
    fetchSavedTableViews();
  }, []);

  const fetchSavedTableViews = async () => {
    setTableViewsLoading(true);
    try {
      const response = await fetch('/api/saved-table-views');
      if (response.ok) {
        const views = await response.json();
        setSavedTableViews(views);
      } else {
        message.error('Failed to fetch saved table views');
      }
    } catch (error) {
      console.error('Error fetching saved table views:', error);
      message.error('Failed to fetch saved table views');
    } finally {
      setTableViewsLoading(false);
    }
  };

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        form.setFieldsValue(parsed);
      } else {
        form.setFieldsValue(settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      form.setFieldsValue(settings);
    }
  };

  const handleSave = async (values: AppSettings) => {
    setLoading(true);
    try {
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('app-settings', JSON.stringify(values));
      setSettings(values);
      message.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      appName: 'Quad Admin Panel',
      maxConnections: 10,
      enableLogging: true,
      sessionTimeout: 30,
      enableTelemetry: false,
      defaultPageSize: 50
    };
    
    form.setFieldsValue(defaultSettings);
    setSettings(defaultSettings);
    message.info('Settings reset to defaults');
  };

  const handleEditTableView = (view: SavedTableView) => {
    setEditingView(view);
    editForm.setFieldsValue({
      display_name: view.display_name,
      icon: view.icon || 'table'
    });
    setEditModalVisible(true);
  };

  const handleUpdateTableView = async (values: any) => {
    if (!editingView) return;

    try {
      const response = await fetch('/api/saved-table-views', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingView.id,
          display_name: values.display_name,
          icon: values.icon
        }),
      });

      if (response.ok) {
        message.success('Table view updated successfully');
        setEditModalVisible(false);
        fetchSavedTableViews();
      } else {
        message.error('Failed to update table view');
      }
    } catch (error) {
      console.error('Error updating table view:', error);
      message.error('Failed to update table view');
    }
  };

  const handleDeleteTableView = async (view: SavedTableView) => {
    try {
      const response = await fetch(`/api/saved-table-views?id=${view.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Table view deleted successfully');
        fetchSavedTableViews();
      } else {
        message.error('Failed to delete table view');
      }
    } catch (error) {
      console.error('Error deleting table view:', error);
      message.error('Failed to delete table view');
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'database':
        return <DatabaseOutlined />;
      case 'star':
        return <StarOutlined />;
      case 'table':
      default:
        return <TableOutlined />;
    }
  };

  const tableViewColumns = [
    {
      title: 'Display Name',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (text: string, record: SavedTableView) => (
        <Space>
          {getIconComponent(record.icon || 'table')}
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Table',
      dataIndex: 'table_name',
      key: 'table_name',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Connection',
      dataIndex: 'connection_name',
      key: 'connection_name',
      render: (text: string) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SavedTableView) => (
        <Space>
          <Tooltip title="Edit table view">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditTableView(record)}
            />
          </Tooltip>
          <Tooltip title="Delete table view">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Table View',
                  content: `Are you sure you want to delete "${record.display_name}"?`,
                  onOk: () => handleDeleteTableView(record),
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SettingOutlined />
          Application Settings
        </Title>
        <Text type="secondary">
          Configure your admin panel preferences and system settings
        </Text>
      </div>

      <div style={{ maxWidth: '800px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={settings}
        >
          {/* General Settings */}
          <Card 
            title={
              <Space>
                <GlobalOutlined />
                General Settings
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Form.Item
              name="appName"
              label="Application Name"
              rules={[{ required: true, message: 'Please enter application name' }]}
            >
              <Input placeholder="Quad Admin Panel" />
            </Form.Item>

            <Form.Item
              name="defaultPageSize"
              label="Default Page Size"
              rules={[{ required: true, message: 'Please enter default page size' }]}
            >
              <InputNumber 
                min={10} 
                max={500} 
                style={{ width: '100%' }}
                placeholder="50"
              />
            </Form.Item>

            <Form.Item
              name="sessionTimeout"
              label="Session Timeout (minutes)"
              rules={[{ required: true, message: 'Please enter session timeout' }]}
            >
              <InputNumber 
                min={5} 
                max={1440} 
                style={{ width: '100%' }}
                placeholder="30"
              />
            </Form.Item>
          </Card>

          {/* Database Settings */}
          <Card 
            title={
              <Space>
                <img src="/favicon.svg" alt="Database" style={{ width: '16px', height: '16px' }} />
                Database Settings
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Form.Item
              name="maxConnections"
              label="Maximum Concurrent Connections"
              rules={[{ required: true, message: 'Please enter max connections' }]}
            >
              <InputNumber 
                min={1} 
                max={100} 
                style={{ width: '100%' }}
                placeholder="10"
              />
            </Form.Item>

            <Form.Item
              name="enableLogging"
              label="Enable Database Query Logging"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Card>

          {/* Security & Privacy */}
          <Card 
            title={
              <Space>
                <SecurityScanOutlined />
                Security & Privacy
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            <Alert
              message="Privacy First"
              description="This admin panel is designed with zero telemetry by default. All data stays on your servers."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Form.Item
              name="enableTelemetry"
              label="Enable Anonymous Usage Analytics"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Text type="secondary" style={{ fontSize: '12px' }}>
              When enabled, anonymous usage statistics help improve the application. 
              No sensitive data is collected.
            </Text>
          </Card>

          {/* Saved Table Views Management */}
          <Card
            title={
              <Space>
                <TableOutlined />
                Saved Table Views
              </Space>
            }
            style={{ marginBottom: '24px' }}
            extra={
              <Button
                size="small"
                onClick={fetchSavedTableViews}
                loading={tableViewsLoading}
              >
                Refresh
              </Button>
            }
          >
            <Alert
              message="Manage Sidebar Table Views"
              description="Here you can manage all table views that appear in the sidebar for quick access."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Table
              columns={tableViewColumns}
              dataSource={savedTableViews}
              rowKey="id"
              loading={tableViewsLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
              locale={{
                emptyText: 'No saved table views found. Use "Add Table to Sidebar" button in the Tables page to add some.'
              }}
            />
          </Card>

          {/* Action Buttons */}
          <Card>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  Save Settings
                </Button>
                <Button onClick={handleReset}>
                  Reset to Defaults
                </Button>
              </Space>
            </Form.Item>
          </Card>
        </Form>

        {/* Edit Table View Modal */}
        <Modal
          title="Edit Table View"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdateTableView}
          >
            <Form.Item
              name="display_name"
              label="Display Name"
              rules={[{ required: true, message: 'Please enter display name' }]}
            >
              <Input placeholder="Enter display name" />
            </Form.Item>

            <Form.Item
              name="icon"
              label="Icon"
              rules={[{ required: true, message: 'Please select an icon' }]}
            >
              <Select placeholder="Select an icon">
                <Select.Option value="table">
                  <Space>
                    <TableOutlined />
                    Table
                  </Space>
                </Select.Option>
                <Select.Option value="database">
                  <Space>
                    <DatabaseOutlined />
                    Database
                  </Space>
                </Select.Option>
                <Select.Option value="star">
                  <Space>
                    <StarOutlined />
                    Star
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setEditModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  Update
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}