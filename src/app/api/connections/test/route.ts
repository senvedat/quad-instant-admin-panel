import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/database';
import { DatabaseConnection } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: DatabaseConnection = await request.json();
    
    // Validate required fields
    if (!body.host || !body.port || !body.database_name || !body.username || !body.password) {
      return NextResponse.json(
        { success: false, message: 'All connection fields are required' },
        { status: 400 }
      );
    }
    
    const result = await testConnection(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to test connection' },
      { status: 500 }
    );
  }
}