export interface Comment {
  id?: string;
  projectId: string;
  userId: string;
  userEmail: string;
  displayName: string;
  text: string;
  createdAt: Date;
  createdBy?: string;
  updatedBy?: string;
  createdDate?: Date;
  updatedDate?: Date;
}
