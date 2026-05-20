/** Moderation state for gallery visibility. */
export type EventPhotoStatus = "pending" | "approved" | "rejected";

export type EventGalleryMediaType = "image" | "video";

/** Event gallery media metadata (Firestore + Storage). `imageUrl` holds any media URL. */
export type EventPhoto = {
  id: string;
  hackathonId: string;
  eventName: string;
  /** Display name in gallery (rename). Falls back to caption or event name. */
  title?: string;
  /** Calendar day for filters, ISO `YYYY-MM-DD`. */
  eventDate: string;
  /** Public URL — image or video. */
  imageUrl: string;
  mediaType?: EventGalleryMediaType;
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
  title?: string;
  mediaType?: EventGalleryMediaType;
};

export type EventPhotoMetadataPatch = {
  eventName?: string;
  eventDate?: string;
  caption?: string;
  title?: string;
};
