import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const docPath = path.join(process.cwd(), 'API_DOCUMENTATION.md');
  try {
    const content = fs.readFileSync(docPath, 'utf-8');
    return NextResponse.json({ success: true, documentation: content });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Documentation not found.' }, { status: 404 });
  }
}
