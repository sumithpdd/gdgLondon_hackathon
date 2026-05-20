import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  deleteField,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, functions, storage } from "./firebase";
import {
  EVENT_PHOTOS_COLLECTION,
  EVENT_PHOTOS_STORAGE_PREFIX,
  MAX_EVENT_PHOTOS_PER_ATTENDEE,
} from "./constants";
import { formatLocaleDateTime } from "./format-date";
import { validateGalleryMediaFile } from "./validators";
import type { EventGalleryMediaType } from "@/types/event-photo";
import type {
  EventPhoto,
  EventPhotoInput,
  EventPhotoMetadataPatch,
  EventPhotoStatus,
} from "@/types/event-photo";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeEventDateInput(value: string): string {
  const trimmed = value.trim();
  if (ISO_DATE.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) throw new Error("Use a valid event date (YYYY-MM-DD).");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sanitizeEventPhotoText(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function parseStatus(value: unknown): EventPhotoStatus | undefined {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return undefined;
}

function parseMediaType(value: unknown): EventGalleryMediaType {
  return value === "video" ? "video" : "image";
}

/** Label shown in gallery UI. */
export function getEventPhotoDisplayTitle(photo: EventPhoto): string {
  return photo.title?.trim() || photo.caption?.trim() || photo.eventName;
}

export function isEventPhotoVideo(photo: EventPhoto): boolean {
  return photo.mediaType === "video";
}

export function galleryMediaTypeFromFile(file: File): EventGalleryMediaType {
  return file.type.startsWith("video/") ? "video" : "image";
}

export function defaultTitleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").trim();
  return base.slice(0, 120) || "Untitled";
}

function mapDoc(id: string, data: Record<string, unknown>): EventPhoto {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined;
  const reviewedAt = data.reviewedAt as { toDate?: () => Date } | undefined;
  return {
    id,
    hackathonId: String(data.hackathonId || ""),
    eventName: String(data.eventName || ""),
    title: data.title ? String(data.title) : undefined,
    eventDate: String(data.eventDate || ""),
    imageUrl: String(data.imageUrl || ""),
    mediaType: parseMediaType(data.mediaType),
    storagePath: String(data.storagePath || ""),
    caption: data.caption ? String(data.caption) : undefined,
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : undefined,
    uploadedBy: String(data.uploadedBy || ""),
    status: parseStatus(data.status),
    createdAt: createdAt?.toDate?.(),
    reviewedAt: reviewedAt?.toDate?.(),
    reviewedBy: data.reviewedBy ? String(data.reviewedBy) : undefined,
  };
}

export function isEventPhotoPublished(photo: EventPhoto): boolean {
  return photo.status === "approved" || photo.status === undefined;
}

export function isEventPhotoPending(photo: EventPhoto): boolean {
  return photo.status === "pending";
}

export type AttendeeEventPhotoQuota = {
  used: number;
  max: number;
  remaining: number;
  canUpload: boolean;
};

/** Counts all of a user's photo docs (pending + approved). */
export function getAttendeeEventPhotoQuota(photos: EventPhoto[]): AttendeeEventPhotoQuota {
  const used = photos.length;
  const max = MAX_EVENT_PHOTOS_PER_ATTENDEE;
  return {
    used,
    max,
    remaining: Math.max(0, max - used),
    canUpload: used < max,
  };
}

/** Public gallery — approved only. */
export async function fetchApprovedEventPhotos(): Promise<EventPhoto[]> {
  const q = query(
    collection(db, EVENT_PHOTOS_COLLECTION),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc"),
    limit(500)
  );
  try {
    const snap = await getDocs(q);
    return sortEventPhotosForGallery(
      snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
    );
  } catch {
    const fallback = query(
      collection(db, EVENT_PHOTOS_COLLECTION),
      where("status", "==", "approved"),
      limit(500)
    );
    const snap = await getDocs(fallback);
    return sortEventPhotosForGallery(
      snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
    );
  }
}

/** @deprecated Use fetchApprovedEventPhotos */
export async function fetchEventPhotos(): Promise<EventPhoto[]> {
  return fetchApprovedEventPhotos();
}

/** Admin moderation queue + published list (requires admin read in rules). */
export async function fetchEventPhotosForAdmin(): Promise<EventPhoto[]> {
  const q = query(
    collection(db, EVENT_PHOTOS_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(500)
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
  } catch {
    const snap = await getDocs(query(collection(db, EVENT_PHOTOS_COLLECTION), limit(500)));
    return sortEventPhotosByUploaded(
      snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
    );
  }
}

/** Attendee's own submissions (any status). */
export async function fetchMySubmittedEventPhotos(uid: string): Promise<EventPhoto[]> {
  const q = query(
    collection(db, EVENT_PHOTOS_COLLECTION),
    where("uploadedBy", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
  } catch {
    const snap = await getDocs(
      query(collection(db, EVENT_PHOTOS_COLLECTION), where("uploadedBy", "==", uid), limit(50))
    );
    return sortEventPhotosByUploaded(
      snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>))
    );
  }
}

/** One-time: legacy admin uploads without `status` → approved. */
export async function backfillLegacyEventPhotosAsApproved(): Promise<number> {
  const all = await fetchEventPhotosForAdmin();
  const legacy = all.filter((p) => p.status === undefined);
  await Promise.all(
    legacy.map((p) =>
      updateDoc(doc(db, EVENT_PHOTOS_COLLECTION, p.id), {
        status: "approved",
        reviewedAt: serverTimestamp(),
      })
    )
  );
  return legacy.length;
}

export function eventPhotoUploadedDateKey(photo: EventPhoto): string | null {
  if (!photo.createdAt) return null;
  const d = photo.createdAt;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatEventPhotoUploadedLabel(photo: EventPhoto): string {
  return formatLocaleDateTime(photo.createdAt, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function eventPhotoStatusLabel(photo: EventPhoto): string {
  if (photo.status === "pending") return "Awaiting approval";
  if (photo.status === "rejected") return "Not published";
  if (photo.status === "approved") return "Published";
  return "Published";
}

export function filterEventPhotos(
  photos: EventPhoto[],
  filters: { eventName?: string; eventDate?: string; uploadedDate?: string }
): EventPhoto[] {
  return photos.filter((p) => {
    if (filters.eventName && filters.eventName !== "all" && p.eventName !== filters.eventName) {
      return false;
    }
    if (filters.eventDate && filters.eventDate !== "all" && p.eventDate !== filters.eventDate) {
      return false;
    }
    if (filters.uploadedDate && filters.uploadedDate !== "all") {
      const key = eventPhotoUploadedDateKey(p);
      if (key !== filters.uploadedDate) return false;
    }
    return true;
  });
}

export function sortEventPhotosByUploaded(photos: EventPhoto[]): EventPhoto[] {
  return [...photos].sort((a, b) => {
    const bt = b.createdAt?.getTime() ?? 0;
    const at = a.createdAt?.getTime() ?? 0;
    return bt - at;
  });
}

/** Public carousel order: explicit `sortOrder` first, then newest. */
export function sortEventPhotosForGallery(photos: EventPhoto[]): EventPhoto[] {
  return [...photos].sort((a, b) => {
    const aOrder = a.sortOrder;
    const bOrder = b.sortOrder;
    const aHas = typeof aOrder === "number";
    const bHas = typeof bOrder === "number";
    if (aHas && bHas) return aOrder - bOrder;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    const bt = b.createdAt?.getTime() ?? 0;
    const at = a.createdAt?.getTime() ?? 0;
    return bt - at;
  });
}

export async function updateEventPhotoMetadata(
  photoId: string,
  patch: EventPhotoMetadataPatch
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.eventName != null) {
    payload.eventName = sanitizeEventPhotoText(patch.eventName, 120);
  }
  if (patch.eventDate != null) {
    payload.eventDate = normalizeEventDateInput(patch.eventDate);
  }
  if (patch.caption !== undefined) {
    const trimmed = patch.caption.trim();
    payload.caption = trimmed
      ? sanitizeEventPhotoText(trimmed, 300)
      : (deleteField() as unknown as string);
  }
  if (patch.title !== undefined) {
    const trimmed = patch.title.trim();
    payload.title = trimmed
      ? sanitizeEventPhotoText(trimmed, 120)
      : (deleteField() as unknown as string);
  }
  if (Object.keys(payload).length === 0) return;
  await updateDoc(doc(db, EVENT_PHOTOS_COLLECTION, photoId), payload);
}

export async function saveEventPhotoSortOrders(
  orderedIds: string[],
  startIndex = 0
): Promise<void> {
  if (orderedIds.length === 0) return;
  const batch = writeBatch(db);
  orderedIds.forEach((id, i) => {
    batch.update(doc(db, EVENT_PHOTOS_COLLECTION, id), { sortOrder: startIndex + i });
  });
  await batch.commit();
}

async function nextGallerySortOrder(): Promise<number> {
  const approved = await fetchApprovedEventPhotos();
  const max = approved.reduce((m, p) => Math.max(m, p.sortOrder ?? -1), -1);
  return max + 1;
}

export function eventPhotoFilterOptions(photos: EventPhoto[]): {
  eventNames: string[];
  eventDates: string[];
  uploadedDates: string[];
} {
  const names = new Set<string>();
  const dates = new Set<string>();
  const uploaded = new Set<string>();
  photos.forEach((p) => {
    if (p.eventName) names.add(p.eventName);
    if (p.eventDate) dates.add(p.eventDate);
    const up = eventPhotoUploadedDateKey(p);
    if (up) uploaded.add(up);
  });
  return {
    eventNames: Array.from(names).sort((a, b) => a.localeCompare(b)),
    eventDates: Array.from(dates).sort((a, b) => b.localeCompare(a)),
    uploadedDates: Array.from(uploaded).sort((a, b) => b.localeCompare(a)),
  };
}

export function formatEventPhotoDateLabel(isoDate: string): string {
  if (!ISO_DATE.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function storageExtensionForFile(file: File): string {
  const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "";
  if (file.type.startsWith("video/")) {
    if (ext === "mp4" || ext === "webm" || ext === "mov") return ext;
    if (file.type === "video/webm") return "webm";
    if (file.type === "video/quicktime") return "mov";
    return "mp4";
  }
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return ext!;
  return "jpg";
}

function safeStorageFileName(file: File): string {
  const ext = storageExtensionForFile(file);
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
}

type ReserveEventPhotoResult = { photoId: string; storagePath: string };

/** Attendee upload — quota enforced server-side (reserve → Storage → finalize). */
export async function uploadAttendeeEventPhoto(
  file: File,
  meta: EventPhotoInput,
  uploadedByUid: string
): Promise<EventPhoto> {
  const validation = validateGalleryMediaFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const hackathonId = sanitizeEventPhotoText(meta.hackathonId, 80);
  const eventName = sanitizeEventPhotoText(meta.eventName, 120);
  const eventDate = normalizeEventDateInput(meta.eventDate);
  const caption = meta.caption ? sanitizeEventPhotoText(meta.caption, 300) : undefined;
  const title = meta.title ? sanitizeEventPhotoText(meta.title, 120) : undefined;
  const mediaType = meta.mediaType ?? galleryMediaTypeFromFile(file);

  if (!hackathonId || !eventName) {
    throw new Error("Event name is required.");
  }

  const mine = await fetchMySubmittedEventPhotos(uploadedByUid);
  const quota = getAttendeeEventPhotoQuota(mine);
  if (!quota.canUpload) {
    throw new Error(
      `You can have at most ${MAX_EVENT_PHOTOS_PER_ATTENDEE} items. Withdraw a pending upload to free a slot.`
    );
  }

  const reserveFn = httpsCallable<
    {
      hackathonId: string;
      eventName: string;
      eventDate: string;
      caption?: string;
      title?: string;
      mediaType: EventGalleryMediaType;
    },
    ReserveEventPhotoResult
  >(functions, "reserveEventPhotoUpload");

  let photoId = "";
  let storagePath = "";

  try {
    const { data: reserved } = await reserveFn({
      hackathonId,
      eventName,
      eventDate,
      mediaType,
      ...(caption ? { caption } : {}),
      ...(title ? { title } : {}),
    });
    photoId = reserved.photoId;
    storagePath = reserved.storagePath;

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const imageUrl = await getDownloadURL(storageRef);

    const finalizeFn = httpsCallable<{ photoId: string; imageUrl: string }, { success: boolean }>(
      functions,
      "finalizeEventPhotoUpload"
    );
    await finalizeFn({ photoId, imageUrl });

    return {
      id: photoId,
      hackathonId,
      eventName,
      title,
      eventDate,
      imageUrl,
      mediaType,
      storagePath,
      caption,
      uploadedBy: uploadedByUid,
      status: "pending",
      createdAt: new Date(),
    };
  } catch (e) {
    if (photoId) {
      try {
        await withdrawEventPhotoById(photoId);
      } catch {
        /* cleanup best-effort */
      }
    }
    const msg = e instanceof Error ? e.message : "Upload failed.";
    if (msg.includes("resource-exhausted") || msg.includes("at most")) {
      throw new Error(
        `You can have at most ${MAX_EVENT_PHOTOS_PER_ATTENDEE} photos (including pending).`
      );
    }
    throw e instanceof Error ? e : new Error(msg);
  }
}

export async function withdrawEventPhotoById(photoId: string): Promise<void> {
  const fn = httpsCallable<{ photoId: string }, { success: boolean }>(
    functions,
    "withdrawEventPhoto"
  );
  await fn({ photoId });
}

/** Admin / organiser direct upload (published immediately). */
export async function uploadEventPhoto(
  file: File,
  meta: EventPhotoInput,
  uploadedByUid: string,
  options?: { publishImmediately?: boolean }
): Promise<EventPhoto> {
  const validation = validateGalleryMediaFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const hackathonId = sanitizeEventPhotoText(meta.hackathonId, 80);
  const eventName = sanitizeEventPhotoText(meta.eventName, 120);
  const eventDate = normalizeEventDateInput(meta.eventDate);
  const caption = meta.caption ? sanitizeEventPhotoText(meta.caption, 300) : undefined;
  const title = meta.title ? sanitizeEventPhotoText(meta.title, 120) : undefined;
  const mediaType = meta.mediaType ?? galleryMediaTypeFromFile(file);
  const publishImmediately = options?.publishImmediately === true;
  const status: EventPhotoStatus = publishImmediately ? "approved" : "pending";

  if (!hackathonId || !eventName) {
    throw new Error("Event name is required.");
  }

  const fileName = safeStorageFileName(file);
  const storagePath = `${EVENT_PHOTOS_STORAGE_PREFIX}/${hackathonId}/${fileName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const imageUrl = await getDownloadURL(storageRef);

  const sortOrder = publishImmediately ? await nextGallerySortOrder() : undefined;

  const docRef = await addDoc(collection(db, EVENT_PHOTOS_COLLECTION), {
    hackathonId,
    eventName,
    eventDate,
    imageUrl,
    storagePath,
    mediaType,
    status,
    ...(title ? { title } : {}),
    ...(caption ? { caption } : {}),
    uploadedBy: uploadedByUid,
    createdAt: serverTimestamp(),
    ...(typeof sortOrder === "number" ? { sortOrder } : {}),
    ...(publishImmediately
      ? { reviewedAt: serverTimestamp(), reviewedBy: uploadedByUid }
      : {}),
  });

    return {
    id: docRef.id,
    hackathonId,
    eventName,
    title,
    eventDate,
    imageUrl,
    mediaType,
    storagePath,
    caption,
    uploadedBy: uploadedByUid,
    status,
    createdAt: new Date(),
    reviewedBy: publishImmediately ? uploadedByUid : undefined,
    reviewedAt: publishImmediately ? new Date() : undefined,
  };
}

export async function approveEventPhoto(photoId: string, reviewerUid: string): Promise<void> {
  const sortOrder = await nextGallerySortOrder();
  await updateDoc(doc(db, EVENT_PHOTOS_COLLECTION, photoId), {
    status: "approved",
    sortOrder,
    reviewedAt: serverTimestamp(),
    reviewedBy: reviewerUid,
  });
}

export async function approveEventPhotosBatch(
  photoIds: string[],
  reviewerUid: string
): Promise<number> {
  let n = 0;
  for (const id of photoIds) {
    await approveEventPhoto(id, reviewerUid);
    n += 1;
  }
  return n;
}

/** Decline pending or remove inappropriate photo (Storage + Firestore). */
export async function rejectEventPhoto(photo: EventPhoto): Promise<void> {
  await withdrawEventPhotoById(photo.id);
}

export async function deleteEventPhoto(photo: EventPhoto): Promise<void> {
  await withdrawEventPhotoById(photo.id);
}
