import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Helper function to sanitize user data
function sanitizeUserData(user) {
  const { password_hash, reset_code, reset_code_expires, ...sanitized } = user;
  return sanitized;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (email) {
      // Get user by email
      const result = await sql`
        SELECT * FROM users 
        WHERE email = ${email}
      `;

      if (result.rows.length > 0) {
        const user = sanitizeUserData(result.rows[0]);
        return NextResponse.json({
          success: true,
          data: user,
          message: 'User found'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'User not found'
        }, { status: 404 });
      }
    } else {
      // Get all users (without sensitive data)
      const result = await sql`
        SELECT 
          id, name, email, user_id, referrer_id, 
          token_id, created_at, updated_at, plan_a,
          profile_picture, profile_media_type
        FROM users
      `;

      return NextResponse.json({
        success: true,
        data: result.rows,
        message: 'Users retrieved successfully'
      });
    }
  } catch (error) {
    console.error('GET Users Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database error'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    if (action === 'login') {
      // Handle login
      const result = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'User not found'
        }, { status: 404 });
      }

      const user = result.rows[0];
      
      // Verify password (you should use proper password hashing)
      // For now, using simple comparison - UPDATE THIS with proper bcrypt
      if (user.password_hash === password) {
        const sanitizedUser = sanitizeUserData(user);
        return NextResponse.json({
          success: true,
          data: sanitizedUser,
          message: 'Login successful'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Invalid password'
        }, { status: 401 });
      }
    }

    // Handle other POST actions
    switch (action) {
      case 'forgot_password':
        // Generate reset code
        const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        await sql`
          UPDATE users 
          SET reset_code = ${resetCode}, reset_code_expires = ${expiresAt.toISOString()}
          WHERE email = ${email}
        `;

        return NextResponse.json({
          success: true,
          data: { reset_code: resetCode },
          message: 'Reset code generated'
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('POST Users Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error'
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { action, email, ...updateData } = body;

    if (!action || !email) {
      return NextResponse.json({
        success: false,
        message: 'Action and email are required'
      }, { status: 400 });
    }

    switch (action) {
      case 'update_profile':
        const { name, remove_profile_picture } = updateData;
        
        if (!name) {
          return NextResponse.json({
            success: false,
            message: 'Name is required'
          }, { status: 400 });
        }

        let updateQuery = sql`
          UPDATE users 
          SET name = ${name}, updated_at = CURRENT_TIMESTAMP
        `;

        if (remove_profile_picture) {
          updateQuery = sql`
            UPDATE users 
            SET name = ${name}, profile_picture = NULL, 
                profile_media_type = NULL, updated_at = CURRENT_TIMESTAMP
          `;
        }

        updateQuery = sql`${updateQuery} WHERE email = ${email} RETURNING *`;

        const result = await updateQuery;

        if (result.rows.length > 0) {
          const updatedUser = sanitizeUserData(result.rows[0]);
          return NextResponse.json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully'
          });
        } else {
          return NextResponse.json({
            success: false,
            message: 'User not found'
          }, { status: 404 });
        }

      case 'change_password':
        const { current_password, new_password } = updateData;
        
        // Verify current password
        const userResult = await sql`
          SELECT password_hash FROM users WHERE email = ${email}
        `;

        if (userResult.rows.length === 0) {
          return NextResponse.json({
            success: false,
            message: 'User not found'
          }, { status: 404 });
        }

        const user = userResult.rows[0];
        
        // Simple password verification - UPDATE THIS with proper bcrypt
        if (user.password_hash !== current_password) {
          return NextResponse.json({
            success: false,
            message: 'Current password is incorrect'
          }, { status: 401 });
        }

        // Update password
        await sql`
          UPDATE users 
          SET password_hash = ${new_password}, updated_at = CURRENT_TIMESTAMP
          WHERE email = ${email}
        `;

        return NextResponse.json({
          success: true,
          message: 'Password updated successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('PUT Users Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error'
    }, { status: 500 });
  }
}