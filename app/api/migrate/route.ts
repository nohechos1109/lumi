import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { secret } = await req.json();

    if (secret !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 0. Ensure pgcrypto for UUIDs
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // 1. Create projects table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          customer_id UUID REFERENCES contacts(id),
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          status TEXT NOT NULL DEFAULT 'draft',
          description TEXT,
          user_id UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Add project_id to quotes if not exists
    await pool.query(`
      DO $$ 
      BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotes' AND column_name='project_id') THEN
              ALTER TABLE quotes ADD COLUMN project_id UUID REFERENCES projects(id);
          END IF;
      END $$;
    `);

    // 3. Migrate existing projects
    await pool.query(`
      UPDATE projects SET status = 'process' WHERE status = 'draft';
      UPDATE projects SET status = 'cancelled' WHERE status = 'closed';
      ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'follow_up';
    `);

    return NextResponse.json({ 
      success: true, 
      message: 'Tablas de proyectos, columnas y estados actualizados correctamente.' 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
