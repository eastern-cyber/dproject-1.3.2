import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Test database connection
    const result = await sql`SELECT NOW() as current_time`;
    
    return Response.json({
      success: true,
      message: 'Database connected successfully',
      timestamp: result.rows[0].current_time,
      database: 'Neon PostgreSQL'
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    }, { status: 500 });
  }
}