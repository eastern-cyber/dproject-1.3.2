// src/app/api/3k-users/[userId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mysql from '@/lib/mysql';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // ใช้ await เพื่อรับ params
    const { userId } = await params;
    
    console.log('Fetching 3K user data for:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!mysql) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Query ข้อมูลจาก MySQL database จริง
    const [users] = await mysql.execute(
      `SELECT user_id, name, email, token_id 
       FROM users 
       WHERE user_id = ?`,
      [userId]
    );

    const userArray = users as any[];

    if (userArray && userArray.length > 0) {
      const userData = userArray[0];
      return NextResponse.json({
        user_id: userData.user_id,
        name: userData.name,
        email: userData.email,
        token_id: userData.token_id
      });
    } else {
      return NextResponse.json(
        { error: '3K user not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error fetching 3K user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}