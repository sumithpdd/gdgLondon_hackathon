export interface HackathonUpdate {
  id?: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  createdBy?: string;
  updatedBy?: string;
  createdDate?: Date;
  updatedDate?: Date;
}
