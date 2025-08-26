import { NextRequest, NextResponse } from 'next/server';
import { getAdminPool } from '@/lib/database';
import { DatabaseConnection } from '@/types';
import { encrypt } from '@/lib/crypto';

// GET - Fetch all connections
export async function GET(request: NextRequest) {
  try {
    const pool = getAdminPool();
    
    const query = `
      SELECT 
        id, name, host, port, database_name, username, 
        is_active, created_at, updated_at
      FROM database_connections 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// POST - Create new connection
export async function POST(request: NextRequest) {
  try {
    const body: DatabaseConnection = await request.json();
    const pool = getAdminPool();
    
    // Validate required fields
    if (!body.name || !body.host || !body.database_name || !body.username || !body.password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Encrypt password
    const encryptedPassword = encrypt(body.password);
    
    const query = `
      INSERT INTO database_connections 
      (name, host, port, database_name, username, password_encrypted, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, host, port, database_name, username, is_active, created_at, updated_at
    `;
    
    const values = [
      body.name,
      body.host,
      body.port || 5432,
      body.database_name,
      body.username,
      encryptedPassword,
      body.is_active !== false
    ];
    
    const result = await pool.query(query, values);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}