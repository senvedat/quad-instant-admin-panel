import { NextRequest, NextResponse } from 'next/server';
import { getAdminPool, executeQuery } from '@/lib/database';
import { DatabaseConnection } from '@/types';
import { decrypt } from '@/lib/crypto';

async function getConnectionById(connectionId: string): Promise<DatabaseConnection | null> {
  try {
    const adminPool = getAdminPool();
    const query = `
      SELECT id, name, host, port, database_name, username, password_encrypted, is_active
      FROM database_connections 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await adminPool.query(query, [connectionId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const conn = result.rows[0];
    
    return {
      id: conn.id,
      name: conn.name,
      host: conn.host,
      port: conn.port,
      database_name: conn.database_name,
      username: conn.username,
      password: decrypt(conn.password_encrypted), // Decrypt the password
      is_active: conn.is_active
    };
  } catch (error) {
    console.error('Error getting connection:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, query } = body;
    
    if (!connectionId || !query) {
      return NextResponse.json(
        { success: false, error: 'Connection ID and query are required' },
        { status: 400 }
      );
    }
    
    const connection = await getConnectionById(connectionId);
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Basic SQL injection protection - only allow SELECT statements for now
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select') && 
        !trimmedQuery.startsWith('with') && 
        !trimmedQuery.startsWith('show') &&
        !trimmedQuery.startsWith('describe') &&
        !trimmedQuery.startsWith('explain')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Only SELECT, WITH, SHOW, DESCRIBE, and EXPLAIN statements are allowed for security reasons' 
        },
        { status: 400 }
      );
    }
    
    const result = await executeQuery(connection, query);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute query' },
      { status: 500 }
    );
  }
}