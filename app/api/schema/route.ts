import { NextResponse } from 'next/server';
import { getSchemaDDL, getSchemaExplorerData } from '@/lib/db';

export async function GET() {
  try {
    const ddl = await getSchemaDDL();
    const tables = await getSchemaExplorerData();
    return NextResponse.json({ ddl, tables });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch schema' }, { status: 500 });
  }
}
