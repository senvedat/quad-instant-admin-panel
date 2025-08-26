import { NextRequest, NextResponse } from 'next/server';
import { getAdminPool, getDatabaseSchema, createConnectionPool } from '@/lib/database';
import { decrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    
    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }
    
    // Get connection details from admin database
    const adminPool = getAdminPool();
    const connectionQuery = `
      SELECT host, port, database_name, username, password_encrypted 
      FROM database_connections 
      WHERE id = $1 AND is_active = true
    `;
    
    const connectionResult = await adminPool.query(connectionQuery, [connectionId]);
    
    if (connectionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    const conn = connectionResult.rows[0];
    
    // Create connection object with decrypted password
    const connection = {
      id: parseInt(connectionId),
      name: 'temp',
      host: conn.host,
      port: conn.port,
      database_name: conn.database_name,
      username: conn.username,
      password: decrypt(conn.password_encrypted), // Decrypt the password
      is_active: true
    };
    
    // Get database schema
    const schema = await getDatabaseSchema(connection);
    
    return NextResponse.json(schema);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}