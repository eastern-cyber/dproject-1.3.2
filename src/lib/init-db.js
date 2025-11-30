import { sql } from '@vercel/postgres';

export async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        user_id VARCHAR(255),
        referrer_id VARCHAR(255),
        token_id VARCHAR(255),
        plan_a JSONB,
        profile_picture TEXT,
        profile_media_type VARCHAR(50),
        reset_code VARCHAR(6),
        reset_code_expires TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create updated_at trigger function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Create trigger
    await sql`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users
    `;
    
    await sql`
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id)
    `;

    console.log('Database initialized successfully');
    
    // Check if we have any users
    const userCount = await sql`SELECT COUNT(*) FROM users`;
    console.log(`Total users in database: ${userCount.rows[0].count}`);
    
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}