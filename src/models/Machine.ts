import mongoose, { Schema } from 'mongoose';

export interface IMachine {
  _id: mongoose.Types.ObjectId;
  machineId: string;
  gambinoMachineId?: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  romVersion?: string;
  dipSwitchConfig?: Record<string, any>;
  credentials?: {
    lockPin?: string;
    passwords?: Record<string, string>;
  };
  currentLocation: string;
  storeId?: mongoose.Types.ObjectId;
  status: 'deployed' | 'storage' | 'repair' | 'decommissioned';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MachineSchema = new Schema(
  {
    machineId: { type: String, required: true, unique: true },
    gambinoMachineId: { type: String },
    serialNumber: { type: String, required: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number },
    romVersion: { type: String },
    dipSwitchConfig: { type: Schema.Types.Mixed },
    credentials: {
      lockPin: { type: String },
      passwords: { type: Schema.Types.Mixed },
    },
    currentLocation: { type: String, required: true, default: 'warehouse' },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    status: {
      type: String,
      enum: ['deployed', 'storage', 'repair', 'decommissioned'],
      default: 'storage',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Machine || mongoose.model('Machine', MachineSchema);
