import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Machine from '@/models/Machine';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const storeId = searchParams.get('storeId');

  const query: any = {};
  if (status) query.status = status;
  if (storeId) query.storeId = storeId;

  const machines = await Machine.find(query).populate('storeId').sort({ updatedAt: -1 });
  return NextResponse.json(machines);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await request.json();
    const machine = await Machine.create(body);
    return NextResponse.json(machine, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Machine ID already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
