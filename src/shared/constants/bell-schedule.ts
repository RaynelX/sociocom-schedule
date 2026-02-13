export interface BellSlot {
  pairNumber: number;
  startTime: string;
  endTime: string;
}

export const BELL_SCHEDULE: readonly BellSlot[] = [
  { pairNumber: 1, startTime: '08:30', endTime: '09:50' },
  { pairNumber: 2, startTime: '10:00', endTime: '11:20' },
  { pairNumber: 3, startTime: '11:40', endTime: '13:00' },
  { pairNumber: 4, startTime: '13:10', endTime: '14:30' },
  { pairNumber: 5, startTime: '14:50', endTime: '16:10' },
] as const;

export function getBellSlot(pairNumber: number): BellSlot | undefined {
  return BELL_SCHEDULE.find(s => s.pairNumber === pairNumber);
}