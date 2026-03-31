import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    await pool.query('ALTER TABLE quotes ADD COLUMN IF NOT EXISTS description text;');
    const res2 = await pool.query('ALTER TABLE quotes ADD COLUMN IF NOT EXISTS unit_count int NOT NULL DEFAULT 1 CHECK (unit_count >= 1);');
    
    return NextResponse.json({ success: true, message: 'Migración exitosa: columnas añadidas' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
