export type BuddyRequestStatus = "pending" | "accepted" | "declined";

export interface BuddyRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromDisplayName: string;
  toDisplayName?: string;
  status: BuddyRequestStatus;
  createdAt?: Date;
  respondedAt?: Date;
}
