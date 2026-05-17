/** Row in Firestore `error_logs` (written only via Admin SDK / API routes). */
export type AppErrorLog = {
  id: string;
  message: string;
  name?: string;
  stack?: string;
  /** e.g. window | unhandledrejection | react | api | report | test */
  source: string;
  path?: string;
  url?: string;
  userId?: string;
  userEmail?: string;
  userAgent?: string;
  /** ISO 8601 from server */
  createdAt: string;
};

export type ErrorLogsResponse = {
  logs: AppErrorLog[];
  scanned: number;
  returned: number;
};
