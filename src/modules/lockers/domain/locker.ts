export type LockerStatus = "OPEN" | "CLOSED";

export interface Locker {
  id: string;
  bloqId: string;
  status: LockerStatus;
  isOccupied: boolean;
}
