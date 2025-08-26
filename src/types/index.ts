// Database Connection Types
export interface DatabaseConnection {
  id?: number;
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password_encrypted?: string;
  password?: string; // For form input only
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Admin User Types
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: Omit<AdminUser, 'password_hash'>;
  message?: string;
}

// Database Schema Types
export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_table?: string;
  foreign_column?: string;
}

export interface TableInfo {
  table_name: string;
  table_schema: string;
  table_type: string;
  columns: TableColumn[];
  row_count?: number;
}

// Query Types
export interface SavedQuery {
  id?: number;
  name: string;
  description?: string;
  sql_query: string;
  connection_id: number;
  created_by?: number;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SavedTableView {
  id?: number;
  name: string;
  description?: string;
  connection_id: number;
  connection_name?: string; // Added for display purposes (from JOIN query)
  table_name: string;
  display_name: string;
  icon?: string;
  is_active?: boolean;
  sort_order?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  columns?: string[];
  rowCount?: number;
  error?: string;
  executionTime?: number;
}

// Dashboard Widget Types
export type WidgetType = 'chart' | 'metric' | 'table';

export interface DashboardWidget {
  id?: number;
  title: string;
  widget_type: WidgetType;
  config: {
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    xAxis?: string;
    yAxis?: string;
    aggregation?: 'sum' | 'count' | 'avg' | 'max' | 'min';
    limit?: number;
    refreshInterval?: number;
  };
  query_id: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// CRUD Operation Types
export interface CrudOperation {
  type: 'create' | 'read' | 'update' | 'delete';
  table: string;
  data?: Record<string, any>;
  where?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'date' | 'datetime';
  required?: boolean;
  options?: { label: string; value: any }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Navigation Types
export interface MenuItem {
  key: string;
  label: string;
  icon?: any;
  path?: string;
  children?: MenuItem[];
}