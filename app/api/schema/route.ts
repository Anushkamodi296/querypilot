import { NextResponse } from 'next/server';
import { getSchemaDDL, getSchemaExplorerData, executeQuery } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tableName = searchParams.get('table');

    if (tableName) {
      // Validate table name to prevent injection
      const allowedTables = ['users', 'products', 'categories', 'orders'];
      if (!allowedTables.includes(tableName.toLowerCase())) {
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
      }

      const previewData = await executeQuery(`SELECT * FROM "${tableName}" LIMIT 5`);
      return NextResponse.json({ preview: previewData });
    }

    const ddl = await getSchemaDDL();
    const tables = await getSchemaExplorerData();

    return NextResponse.json({
      ddl,
      tables
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch schema' }, { status: 500 });
  }
}
