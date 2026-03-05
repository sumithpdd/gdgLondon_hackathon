/**
 * Standard audit fields for all Firestore documents.
 * Always include these when creating or updating documents.
 */
export interface AuditFields {
  createdBy: string;
  updatedBy: string;
  createdDate: Date;
  updatedDate: Date;
}

export function newAuditFields(userId: string): AuditFields {
  const now = new Date();
  return {
    createdBy: userId,
    updatedBy: userId,
    createdDate: now,
    updatedDate: now,
  };
}

export function updateAuditFields(userId: string): Pick<AuditFields, "updatedBy" | "updatedDate"> {
  return {
    updatedBy: userId,
    updatedDate: new Date(),
  };
}
