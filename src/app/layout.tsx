'use client';
import { ConfigProvider } from 'antd';
import { useEffect } from 'react';
import './globals.css';

// Peach orange theme colors
const theme = {
  token: {
    colorPrimary: '#ff9f7f', // Light peach orange
    colorPrimaryHover: '#ffb399', // Lighter on hover
    colorPrimaryActive: '#e6896b', // Darker on active
    colorLink: '#ff9f7f',
    colorLinkHover: '#ffb399',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#ff9f7f',
    borderRadius: 6,
    wireframe: false,
  },
  components: {
    Button: {
      colorPrimary: '#ff9f7f',
      colorPrimaryHover: '#ffb399',
      colorPrimaryActive: '#e6896b',
    },
    Menu: {
      itemSelectedBg: '#fff2ed', // Very light peach background for selected items
      itemSelectedColor: '#ff9f7f',
      itemHoverBg: '#fff7f3',
    },
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
    }
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Set document title and meta tags
    document.title = 'Quad Instant Admin Panel';
    
    // Set meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Self-hosted instant admin panel with PostgreSQL support');
    
    // Set favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('href', '/favicon.svg');
    favicon.setAttribute('type', 'image/svg+xml');
  }, []);

  return (
    <html lang="en">
      <body>
        <ConfigProvider theme={theme}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}