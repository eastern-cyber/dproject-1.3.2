import { initDatabase } from '../../../../lib/init-db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Add authentication here if needed
    await initDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Database init error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Just return status without initializing
    return NextResponse.json({
      success: true,
      message: 'Admin endpoint is working'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Admin endpoint error'
    }, { status: 500 });
  }
}