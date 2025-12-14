import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
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

  const store = await Store.findById(id);
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  const machines = await Machine.find({ storeId: id });

  return NextResponse.json({ ...store.toObject(), machines });
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
    const store = await Store.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json(store);
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

  const store = await Store.findByIdAndDelete(id);
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  // Unassign machines from this store
  await Machine.updateMany({ storeId: id }, { $unset: { storeId: 1 }, currentLocation: 'warehouse' });

  return NextResponse.json({ success: true });
}
