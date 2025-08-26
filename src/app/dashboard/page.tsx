'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Button, Empty } from 'antd';
import {
  TableOutlined,
  CodeOutlined,
  PlusOutlined,
  LinkOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface DashboardStats {
  totalConnections: number;
  activeTables: number;
  savedQueries: number;
  totalRecords: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalConnections: 0,
    activeTables: 0,
    savedQueries: 0,
    totalRecords: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add Database Connection',
      description: 'Connect to a new PostgreSQL database',
      icon: <DatabaseOutlined style={{ fontSize: '24px', color: '#ff9f7f' }} />,
      action: () => router.push('/dashboard/connections?action=add'),
    },
    {
      title: 'Browse Tables',
      description: 'Explore your database tables and data',
      icon: <TableOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      action: () => router.push('/dashboard/tables'),
    },
    {
      title: 'Run SQL Query',
      description: 'Execute custom SQL queries',
      icon: <CodeOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      action: () => router.push('/dashboard/query'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Text type="secondary">
          Welcome to your instant admin panel
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Database Connections"
              value={stats.totalConnections}
              prefix={<img src="/favicon.svg" alt="Database" style={{ width: '16px', height: '16px' }} />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Tables"
              value={stats.activeTables}
              prefix={<TableOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Saved Queries"
              value={stats.savedQueries}
              prefix={<CodeOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Records"
              value={stats.totalRecords}
              prefix={<LinkOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card 
        title="Quick Actions" 
        style={{ marginBottom: '32px' }}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => router.push('/dashboard/connections?action=add')}
          >
            Add Connection
          </Button>
        }
      >
        {stats.totalConnections === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                No database connections found.
                <br />
                Add your first connection to get started.
              </span>
            }
          >
            <Button
              type="primary"
              icon={<img src="/favicon.svg" alt="Database" style={{ width: '16px', height: '16px' }} />}
              onClick={() => router.push('/dashboard/connections?action=add')}
            >
              Add Database Connection
            </Button>
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={24} md={8} key={index}>
                <Card
                  hoverable
                  onClick={action.action}
                  style={{ 
                    textAlign: 'center',
                    cursor: 'pointer',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Space direction="vertical" size="small">
                    {action.icon}
                    <Title level={5} style={{ margin: '8px 0 4px 0' }}>
                      {action.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {action.description}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No recent activity"
        />
      </Card>
    </div>
  );
}