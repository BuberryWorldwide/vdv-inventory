import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Machine from '@/models/Machine';
import { isAuthenticated } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

  const machine = await Machine.findById(id).populate('storeId');
  if (!machine) {
    return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
  }

  return NextResponse.json(machine);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

  try {
    const body = await request.json();
    const machine = await Machine.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    return NextResponse.json(machine);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;

  const machine = await Machine.findByIdAndDelete(id);
  if (!machine) {
    return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
