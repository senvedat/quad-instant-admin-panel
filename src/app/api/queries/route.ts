import { NextRequest, NextResponse } from 'next/server';
import { getAdminPool } from '@/lib/database';
import { SavedQuery } from '@/types';

// GET - Fetch saved queries
export async function GET(request: NextRequest) {
  try {
    const pool = getAdminPool();
    
    const query = `
      SELECT 
        sq.id, sq.name, sq.description, sq.sql_query, sq.connection_id,
        sq.is_public, sq.created_at, sq.updated_at,
        dc.name as connection_name
      FROM saved_queries sq
      LEFT JOIN database_connections dc ON sq.connection_id = dc.id
      ORDER BY sq.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching saved queries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved queries' },
      { status: 500 }
    );
  }
}

// POST - Save new query
export async function POST(request: NextRequest) {
  try {
    const body: SavedQuery = await request.json();
    const pool = getAdminPool();
    
    // Validate required fields
    if (!body.name || !body.sql_query || !body.connection_id) {
      return NextResponse.json(
        { error: 'Name, SQL query, and connection ID are required' },
        { status: 400 }
      );
    }
    
    const query = `
      INSERT INTO saved_queries 
      (name, description, sql_query, connection_id, is_public, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, sql_query, connection_id, is_public, created_at, updated_at
    `;
    
    const values = [
      body.name,
      body.description || null,
      body.sql_query,
      body.connection_id,
      body.is_public || false,
      1 // TODO: Get actual user ID from JWT token
    ];
    
    const result = await pool.query(query, values);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error saving query:', error);
    return NextResponse.json(
      { error: 'Failed to save query' },
      { status: 500 }
    );
  }
}