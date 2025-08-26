import { NextRequest, NextResponse } from 'next/server';
import { getAdminPool } from '@/lib/database';

export async function GET() {
  try {
    const pool = getAdminPool();
    
    const result = await pool.query(`
      SELECT stv.*, dc.name as connection_name 
      FROM saved_table_views stv
      JOIN database_connections dc ON stv.connection_id = dc.id
      WHERE dc.is_active = true
      ORDER BY stv.sort_order ASC, stv.created_at ASC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching saved table views:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved table views' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connection_id, table_name, display_name, icon } = body;

    if (!connection_id || !table_name) {
      return NextResponse.json(
        { error: 'Connection ID and table name are required' },
        { status: 400 }
      );
    }

    const pool = getAdminPool();
    
    // Check if this table view already exists
    const existingResult = await pool.query(
      'SELECT id FROM saved_table_views WHERE connection_id = $1 AND table_name = $2',
      [connection_id, table_name]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'This table view is already saved to sidebar' },
        { status: 409 }
      );
    }

    // Get the next sort order
    const sortOrderResult = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM saved_table_views'
    );
    const nextOrder = sortOrderResult.rows[0].next_order;

    // Insert new saved table view
    const result = await pool.query(`
      INSERT INTO saved_table_views (connection_id, table_name, display_name, icon, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [connection_id, table_name, display_name || table_name, icon || 'table', nextOrder]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving table view:', error);
    return NextResponse.json(
      { error: 'Failed to save table view' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, display_name, icon, sort_order } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const pool = getAdminPool();
    
    const result = await pool.query(`
      UPDATE saved_table_views 
      SET display_name = COALESCE($2, display_name),
          icon = COALESCE($3, icon),
          sort_order = COALESCE($4, sort_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, display_name, icon, sort_order]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Table view not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating table view:', error);
    return NextResponse.json(
      { error: 'Failed to update table view' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const pool = getAdminPool();
    
    const result = await pool.query(
      'DELETE FROM saved_table_views WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Table view not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Table view deleted successfully' });
  } catch (error) {
    console.error('Error deleting table view:', error);
    return NextResponse.json(
      { error: 'Failed to delete table view' },
      { status: 500 }
    );
  }
}