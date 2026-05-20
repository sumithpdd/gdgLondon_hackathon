/** Moderation state for gallery visibility. */
export type EventPhotoStatus = "pending" | "approved" | "rejected";

/** Event gallery image metadata (Firestore + Storage). */
export type EventPhoto = {
  id: string;
  hackathonId: string;
  eventName: string;
  /** Calendar day for filters, ISO `YYYY-MM-DD`. */
  eventDate: string;
  imageUrl: string;
  storagePath: string;
  caption?: string;
  sortOrder?: number;
  uploadedBy: string;
  /** Omitted on docs created before moderation (treated as approved when backfilled). */
  status?: EventPhotoStatus;
  createdAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
};

export type EventPhotoInput = {
  hackathonId: string;
  eventName: string;
  eventDate: string;
  caption?: string;
};
