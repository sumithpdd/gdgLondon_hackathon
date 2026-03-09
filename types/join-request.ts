export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface JoinRequest {
  id?: string;
  projectId: string;
  projectTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: JoinRequestStatus;
  message?: string;
  respondedAt?: Date;
  createdAt: Date;
}
