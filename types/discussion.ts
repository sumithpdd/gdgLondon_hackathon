export interface Discussion {
  id?: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  createdDate?: Date;
  updatedDate?: Date;
}
