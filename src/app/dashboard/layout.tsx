'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Divider } from 'antd';
import {
  TableOutlined,
  CodeOutlined,
  DashboardOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DatabaseOutlined,
  StarOutlined,
} from '@ant-design/icons';
import Cookies from 'js-cookie';
import { SavedTableView } from '@/types';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [savedTableViews, setSavedTableViews] = useState<SavedTableView[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication
    const token = Cookies.get('auth-token');
    if (!token) {
      router.push('/login');
      return;
    }

    // You can decode the token here to get user info
    // For now, we'll use a placeholder
    setUser({ username: 'admin', email: 'admin@localhost' });
    
    // Fetch saved table views
    fetchSavedTableViews();
  }, [router]);

  const fetchSavedTableViews = async () => {
    try {
      const response = await fetch('/api/saved-table-views');
      if (response.ok) {
        const views = await response.json();
        setSavedTableViews(views);
      }
    } catch (error) {
      console.error('Error fetching saved table views:', error);
    }
  };

  const handleLogout = () => {
    Cookies.remove('auth-token');
    router.push('/login');
  };

  const getIconForTableView = (iconName: string) => {
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

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/dashboard/connections',
      icon: <img src="/favicon.svg" alt="Database" style={{ width: '16px', height: '16px' }} />,
      label: 'Connections',
    },
    {
      key: '/dashboard/tables',
      icon: <TableOutlined />,
      label: 'Tables',
    },
    {
      key: '/dashboard/query',
      icon: <CodeOutlined />,
      label: 'SQL Query',
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    // Add divider if there are saved table views
    ...(savedTableViews.length > 0 ? [{
      type: 'divider' as const,
      key: 'divider-saved-views',
    }] : []),
    // Add saved table views
    ...savedTableViews.map(view => ({
      key: `/dashboard/table-view/${view.id}`,
      icon: getIconForTableView(view.icon || 'table'),
      label: collapsed ? view.display_name : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{view.display_name}</span>
          <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
            {view.connection_name}
          </Typography.Text>
        </div>
      ),
      title: `${view.display_name} (${view.connection_name})`,
    })),
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
        }}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? '0' : '16px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <img
            src="/favicon.svg"
            alt="Quad Admin Panel Logo"
            style={{ width: '32px', height: '32px' }}
          />
          {!collapsed && (
            <Text strong style={{ marginLeft: '12px', color: '#ff9f7f' }}>
              Quad Admin
            </Text>
          )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[pathname || '/dashboard']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: '16px' }}
        />
        
        {/* Refresh saved views when needed */}
        {savedTableViews.length > 0 && !collapsed && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px'
          }}>
            <Button
              type="text"
              size="small"
              onClick={fetchSavedTableViews}
              style={{
                width: '100%',
                fontSize: '11px',
                color: '#999'
              }}
            >
              Refresh Views
            </Button>
          </div>
        )}
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <Space>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Text>{user?.username}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '24px',
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          minHeight: 'calc(100vh - 112px)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}