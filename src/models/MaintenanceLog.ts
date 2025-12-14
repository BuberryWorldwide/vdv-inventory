import mongoose, { Schema } from 'mongoose';

export interface IMaintenanceLog {
  _id: mongoose.Types.ObjectId;
  machineId: mongoose.Types.ObjectId;
  date: Date;
  technician: string;
  type: 'preventive' | 'repair' | 'install' | 'move' | 'other';
  description: string;
  partsReplaced?: string[];
  cost?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceLogSchema = new Schema(
  {
    machineId: { type: Schema.Types.ObjectId, ref: 'Machine', required: true },
    date: { type: Date, required: true, default: Date.now },
    technician: { type: String, required: true },
    type: {
      type: String,
      enum: ['preventive', 'repair', 'install', 'move', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    partsReplaced: [{ type: String }],
    cost: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.models.MaintenanceLog || mongoose.model('MaintenanceLog', MaintenanceLogSchema);
