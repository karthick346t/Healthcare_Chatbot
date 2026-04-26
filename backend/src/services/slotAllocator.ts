import mongoose from 'mongoose';
import { MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY } from '../constants/appointments';

function getCounterId(doctorId: string, date: Date): string {
  const counterDate = date.toISOString().split('T')[0];
  return `${doctorId}_${counterDate}`;
}

export async function reserveSlotToken(doctorId: string, date: Date): Promise<number> {
  const slotCounter = mongoose.connection.collection('slot_counters');
  const counterId = getCounterId(doctorId, date);

  const counterResult = await slotCounter.findOneAndUpdate(
    { _id: counterId as any },
    { $inc: { count: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const tokenNumber = counterResult?.count ?? 1;
  if (tokenNumber > MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY) {
    await slotCounter.updateOne({ _id: counterId as any }, { $inc: { count: -1 } });
    throw new Error(`Token limit reached for this doctor on selected date (max ${MAX_APPOINTMENTS_PER_DOCTOR_PER_DAY}).`);
  }

  return tokenNumber;
}

