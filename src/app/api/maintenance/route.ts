import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MaintenanceLog from '@/models/MaintenanceLog';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const machineId = searchParams.get('machineId');
  const type = searchParams.get('type');

  const query: any = {};
  if (machineId) query.machineId = machineId;
  if (type) query.type = type;

  const logs = await MaintenanceLog.find(query)
    .populate('machineId')
    .sort({ date: -1 });
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await request.json();
    const log = await MaintenanceLog.create(body);
    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
