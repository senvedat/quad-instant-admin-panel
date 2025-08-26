import { NextRequest, NextResponse } from 'next/server';
import { initializeAdminDatabase, checkDatabaseConnection } from '@/lib/init-database';

export async function GET(request: NextRequest) {
  try {
    // First check database connection
    const connectionCheck = await checkDatabaseConnection();
    
    if (!connectionCheck.success) {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: connectionCheck.message
      }, { status: 500 });
    }
    
    // Initialize admin database
    const initResult = await initializeAdminDatabase();
    
    return NextResponse.json({
      success: initResult.success,
      message: initResult.message,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to initialize database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Same as GET for convenience
  return GET(request);
}