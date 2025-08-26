import { NextRequest, NextResponse } from 'next/server';
import { getAdminPool } from '@/lib/database';
import { DatabaseConnection } from '@/types';
import { encrypt } from '@/lib/crypto';

// PUT - Update connection
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: DatabaseConnection = await request.json();
    const pool = getAdminPool();
    const id = parseInt(params.id);
    
    // Validate required fields
    if (!body.name || !body.host || !body.database_name || !body.username) {
      return NextResponse.json(
        { error: 'Name, host, database name, and username are required' },
        { status: 400 }
      );
    }
    
    let query: string;
    let values: any[];
    
    if (body.password) {
      // Update with new password
      const encryptedPassword = encrypt(body.password);
      query = `
        UPDATE database_connections 
        SET name = $1, host = $2, port = $3, database_name = $4, 
            username = $5, password_encrypted = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING id, name, host, port, database_name, username, is_active, created_at, updated_at
      `;
      values = [
        body.name,
        body.host,
        body.port || 5432,
        body.database_name,
        body.username,
        encryptedPassword,
        body.is_active !== false,
        id
      ];
    } else {
      // Update without changing password
      query = `
        UPDATE database_connections 
        SET name = $1, host = $2, port = $3, database_name = $4, 
            username = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, name, host, port, database_name, username, is_active, created_at, updated_at
      `;
      values = [
        body.name,
        body.host,
        body.port || 5432,
        body.database_name,
        body.username,
        body.is_active !== false,
        id
      ];
    }
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

// DELETE - Delete connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pool = getAdminPool();
    const id = parseInt(params.id);
    
    const query = 'DELETE FROM database_connections WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}