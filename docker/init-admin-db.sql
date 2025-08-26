-- Admin Panel Database Initialization
-- This database stores admin panel configuration, users, and connections

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create database connections table
CREATE TABLE IF NOT EXISTS database_connections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 5432,
    database_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create saved queries table
CREATE TABLE IF NOT EXISTS saved_queries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sql_query TEXT NOT NULL,
    connection_id INTEGER REFERENCES database_connections(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES admin_users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboard widgets table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    widget_type VARCHAR(50) NOT NULL, -- 'chart', 'metric', 'table'
    config JSONB NOT NULL,
    query_id INTEGER REFERENCES saved_queries(id) ON DELETE CASCADE,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 4,
    height INTEGER DEFAULT 3,
    created_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create saved table views table
CREATE TABLE IF NOT EXISTS saved_table_views (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    connection_id INTEGER REFERENCES database_connections(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    icon VARCHAR(50) DEFAULT 'table',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create default admin user (password: admin123)
INSERT INTO admin_users (username, email, password_hash)
VALUES ('admin', 'admin@localhost', '$2a$10$LZ2rylaHlKzxjF1O50lt0uWziR5x3VcsoiLJ5sQtJK.0QPy/uyybC')
ON CONFLICT (username) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_database_connections_created_by ON database_connections(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_queries_connection_id ON saved_queries(connection_id);
CREATE INDEX IF NOT EXISTS idx_saved_queries_created_by ON saved_queries(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_created_by ON dashboard_widgets(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_table_views_connection_id ON saved_table_views(connection_id);
CREATE INDEX IF NOT EXISTS idx_saved_table_views_created_by ON saved_table_views(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_table_views_sort_order ON saved_table_views(sort_order);