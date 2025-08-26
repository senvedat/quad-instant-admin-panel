'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, Alert, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';

export default function Home() {
  const router = useRouter();
  const [initStatus, setInitStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [initMessage, setInitMessage] = useState('Initializing database...');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      const response = await fetch('/api/init');
      const result = await response.json();
      
      if (result.success) {
        setInitStatus('success');
        setInitMessage(result.message);
        
        // Wait a moment then redirect
        setTimeout(() => {
          const token = Cookies.get('auth-token');
          if (token) {
            router.push('/dashboard');
          } else {
            router.push('/login');
          }
        }, 1500);
      } else {
        setInitStatus('error');
        setInitMessage(result.message || 'Database initialization failed');
      }
    } catch (error) {
      setInitStatus('error');
      setInitMessage('Failed to connect to the application');
      console.error('Initialization error:', error);
    }
  };

  const retryInitialization = () => {
    setInitStatus('loading');
    setInitMessage('Retrying database initialization...');
    initializeApp();
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <img
            src="/favicon.svg"
            alt="Quad Admin Panel Logo"
            style={{ width: '64px', height: '64px', marginBottom: '16px' }}
          />
          <h1 style={{ margin: '0 0 8px 0', color: '#ff9f7f' }}>
            Quad Admin Panel
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Instant PostgreSQL Admin Interface
          </p>
        </div>

        {initStatus === 'loading' && (
          <div>
            <Spin size="large" />
            <p style={{ marginTop: '16px', color: '#666' }}>
              {initMessage}
            </p>
          </div>
        )}

        {initStatus === 'success' && (
          <div>
            <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
            <p style={{ marginTop: '16px', color: '#52c41a', fontWeight: 'bold' }}>
              {initMessage}
            </p>
            <p style={{ color: '#666' }}>
              Redirecting to login...
            </p>
          </div>
        )}

        {initStatus === 'error' && (
          <div>
            <CloseCircleOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />
            <Alert
              message="Initialization Failed"
              description={initMessage}
              type="error"
              style={{ margin: '16px 0', textAlign: 'left' }}
            />
            <div style={{ marginTop: '16px' }}>
              <Button
                type="primary"
                onClick={retryInitialization}
                style={{ marginRight: '8px' }}
              >
                Retry
              </Button>
              <Button
                onClick={() => router.push('/login')}
              >
                Continue to Login
              </Button>
            </div>
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
              <p>Make sure your PostgreSQL database is running and accessible.</p>
              <p>Check your .env.local configuration file.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}