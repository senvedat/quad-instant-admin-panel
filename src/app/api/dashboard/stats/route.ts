import { NextRequest, NextResponse } from 'next/server';
import { getAdminPool } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const pool = getAdminPool();
    
    // Get total connections
    const connectionsResult = await pool.query(
      'SELECT COUNT(*) as count FROM database_connections WHERE is_active = true'
    );
    const totalConnections = parseInt(connectionsResult.rows[0].count);
    
    // Get saved queries count
    const queriesResult = await pool.query(
      'SELECT COUNT(*) as count FROM saved_queries'
    );
    const savedQueries = parseInt(queriesResult.rows[0].count);
    
    // For now, we'll set these as placeholders since we need active connections to get real data
    const activeTables = 0;
    const totalRecords = 0;
    
    return NextResponse.json({
      totalConnections,
      activeTables,
      savedQueries,
      totalRecords
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}