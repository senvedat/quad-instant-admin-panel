import { Pool, PoolClient } from 'pg';
import { DatabaseConnection, TableInfo, TableColumn, QueryResult } from '@/types';

// Admin database connection pool
let adminPool: Pool | null = null;

// Dynamic connection pools for user databases
const connectionPools = new Map<string, Pool>();

// Initialize admin database connection
export function getAdminPool(): Pool {
  if (!adminPool) {
    adminPool = new Pool({
      host: process.env.ADMIN_DB_HOST || 'localhost',
      port: parseInt(process.env.ADMIN_DB_PORT || '5432'),
      database: process.env.ADMIN_DB_NAME || 'quad-admin-panel',
      user: process.env.ADMIN_DB_USER || 'postgres',
      password: process.env.ADMIN_DB_PASSWORD || 'value',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return adminPool;
}

// Create connection pool for user database
export function createConnectionPool(connection: DatabaseConnection): Pool {
  const poolKey = `${connection.host}:${connection.port}:${connection.database_name}:${connection.username}`;
  
  if (connectionPools.has(poolKey)) {
    return connectionPools.get(poolKey)!;
  }

  const pool = new Pool({
    host: connection.host,
    port: connection.port,
    database: connection.database_name,
    user: connection.username,
    password: connection.password,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  connectionPools.set(poolKey, pool);
  return pool;
}

// Test database connection
export async function testConnection(connection: DatabaseConnection): Promise<{ success: boolean; message: string }> {
  let client: PoolClient | null = null;
  
  try {
    const pool = createConnectionPool(connection);
    client = await pool.connect();
    await client.query('SELECT 1');
    
    return {
      success: true,
      message: 'Connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Get database schema information
export async function getDatabaseSchema(connection: DatabaseConnection): Promise<TableInfo[]> {
  let client: PoolClient | null = null;
  
  try {
    const pool = createConnectionPool(connection);
    client = await pool.connect();

    // Get all tables
    const tablesQuery = `
      SELECT 
        table_name,
        table_schema,
        table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY table_schema, table_name
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const tables: TableInfo[] = [];

    for (const table of tablesResult.rows) {
      // Get columns for each table
      const columnsQuery = `
        SELECT 
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
          CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
          fk.foreign_table_name as foreign_table,
          fk.foreign_column_name as foreign_column
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.column_name
          FROM information_schema.table_constraints tc
          INNER JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_name = $1
            AND tc.table_schema = $2
        ) pk ON c.column_name = pk.column_name
        LEFT JOIN (
          SELECT 
            ku.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints tc
          INNER JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
          INNER JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = $1
            AND tc.table_schema = $2
        ) fk ON c.column_name = fk.column_name
        WHERE c.table_name = $1 AND c.table_schema = $2
        ORDER BY c.ordinal_position
      `;

      const columnsResult = await client.query(columnsQuery, [table.table_name, table.table_schema]);
      
      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM "${table.table_schema}"."${table.table_name}"`;
      const countResult = await client.query(countQuery);
      
      tables.push({
        table_name: table.table_name,
        table_schema: table.table_schema,
        table_type: table.table_type,
        columns: columnsResult.rows as TableColumn[],
        row_count: parseInt(countResult.rows[0].count)
      });
    }

    return tables;
  } catch (error) {
    console.error('Error getting database schema:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Execute SQL query
export async function executeQuery(
  connection: DatabaseConnection, 
  query: string, 
  params: any[] = []
): Promise<QueryResult> {
  let client: PoolClient | null = null;
  const startTime = Date.now();
  
  try {
    const pool = createConnectionPool(connection);
    client = await pool.connect();
    
    const result = await client.query(query, params);
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      data: result.rows,
      columns: result.fields?.map(field => field.name) || [],
      rowCount: result.rowCount || 0,
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      executionTime
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// CRUD Operations
export async function createRecord(
  connection: DatabaseConnection,
  tableName: string,
  data: Record<string, any>
): Promise<QueryResult> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  
  const query = `
    INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  return executeQuery(connection, query, values);
}

export async function readRecords(
  connection: DatabaseConnection,
  tableName: string,
  where: Record<string, any> = {},
  limit: number = 100,
  offset: number = 0,
  orderBy: string = '',
  orderDirection: 'ASC' | 'DESC' = 'ASC'
): Promise<QueryResult> {
  let query = `SELECT * FROM "${tableName}"`;
  const params: any[] = [];
  let paramIndex = 1;
  
  // Add WHERE clause
  if (Object.keys(where).length > 0) {
    const whereConditions = Object.entries(where).map(([key, value]) => {
      params.push(value);
      return `"${key}" = $${paramIndex++}`;
    });
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  // Add ORDER BY clause
  if (orderBy) {
    query += ` ORDER BY "${orderBy}" ${orderDirection}`;
  }
  
  // Add LIMIT and OFFSET
  query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);
  
  return executeQuery(connection, query, params);
}

export async function updateRecord(
  connection: DatabaseConnection,
  tableName: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<QueryResult> {
  const setColumns = Object.keys(data);
  const setValues = Object.values(data);
  const whereColumns = Object.keys(where);
  const whereValues = Object.values(where);
  
  let paramIndex = 1;
  const setClause = setColumns.map(col => `"${col}" = $${paramIndex++}`).join(', ');
  const whereClause = whereColumns.map(col => `"${col}" = $${paramIndex++}`).join(' AND ');
  
  const query = `
    UPDATE "${tableName}"
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING *
  `;
  
  return executeQuery(connection, query, [...setValues, ...whereValues]);
}

export async function deleteRecord(
  connection: DatabaseConnection,
  tableName: string,
  where: Record<string, any>
): Promise<QueryResult> {
  const whereColumns = Object.keys(where);
  const whereValues = Object.values(where);
  
  let paramIndex = 1;
  const whereClause = whereColumns.map(col => `"${col}" = $${paramIndex++}`).join(' AND ');
  
  const query = `DELETE FROM "${tableName}" WHERE ${whereClause} RETURNING *`;
  
  return executeQuery(connection, query, whereValues);
}

// Close all connections
export async function closeAllConnections(): Promise<void> {
  if (adminPool) {
    await adminPool.end();
    adminPool = null;
  }
  
  for (const [key, pool] of connectionPools) {
    await pool.end();
    connectionPools.delete(key);
  }
}