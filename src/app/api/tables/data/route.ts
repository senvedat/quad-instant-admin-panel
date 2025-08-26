import { NextRequest, NextResponse } from 'next/server';
import { getAdminPool, readRecords, createRecord, updateRecord, deleteRecord } from '@/lib/database';
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
    
    // Decrypt the stored password
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

// GET - Fetch table data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const table = searchParams.get('table');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!connectionId || !table) {
      return NextResponse.json(
        { error: 'Connection ID and table name are required' },
        { status: 400 }
      );
    }
    
    const connection = await getConnectionById(connectionId);
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    const result = await readRecords(connection, table, {}, limit, offset);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      rows: result.data,
      columns: result.columns,
      rowCount: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching table data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table data' },
      { status: 500 }
    );
  }
}

// POST - Create new record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, table, data } = body;
    
    if (!connectionId || !table || !data) {
      return NextResponse.json(
        { error: 'Connection ID, table name, and data are required' },
        { status: 400 }
      );
    }
    
    const connection = await getConnectionById(connectionId);
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    const result = await createRecord(connection, table, data);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating record:', error);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    );
  }
}

// PUT - Update record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, table, data, where } = body;
    
    if (!connectionId || !table || !data || !where) {
      return NextResponse.json(
        { error: 'Connection ID, table name, data, and where clause are required' },
        { status: 400 }
      );
    }
    
    const connection = await getConnectionById(connectionId);
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    const result = await updateRecord(connection, table, data, where);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    );
  }
}

// DELETE - Delete record
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, table, where } = body;
    
    if (!connectionId || !table || !where) {
      return NextResponse.json(
        { error: 'Connection ID, table name, and where clause are required' },
        { status: 400 }
      );
    }
    
    const connection = await getConnectionById(connectionId);
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    const result = await deleteRecord(connection, table, where);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}