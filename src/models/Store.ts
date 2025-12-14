import mongoose, { Schema } from 'mongoose';

export interface IStore {
  _id: mongoose.Types.ObjectId;
  storeId: string;
  name: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  accessNotes?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema(
  {
    storeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String },
    contactName: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    accessNotes: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model('Store', StoreSchema);
