export type RentStatus = "CREATED" | "WAITING_DROPOFF" | "WAITING_PICKUP" | "DELIVERED";
export type RentSize = "XS" | "S" | "M" | "L" | "XL";

export interface Rent {
  id: string;
  lockerId: string | null;
  weight: number;
  size: RentSize;
  status: RentStatus;
}

export const VALID_TRANSITIONS: Record<RentStatus, RentStatus | null> = {
  CREATED: "WAITING_DROPOFF",
  WAITING_DROPOFF: "WAITING_PICKUP",
  WAITING_PICKUP: "DELIVERED",
  DELIVERED: null,
};

export const ACTIVE_STATUSES: RentStatus[] = ["WAITING_DROPOFF", "WAITING_PICKUP"];
