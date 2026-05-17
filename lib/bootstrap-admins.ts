/**
 * Emails that receive role "admin" on sign-in (client profile sync only).
 * Set NEXT_PUBLIC_ADMIN_EMAIL and/or NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS in .env.local.
 * To grant admin without env: use /admin/users (existing admin) or Firebase Console.
 */
const PLACEHOLDER_ADMIN_EMAIL = "your.email@example.com";

export function getBootstrapAdminEmails(): string[] {
  const emails = new Set<string>();

  const single = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
  if (single && single !== PLACEHOLDER_ADMIN_EMAIL) {
    emails.add(single);
  }

  const list = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS;
  if (list) {
    for (const part of list.split(",")) {
      const e = part.trim().toLowerCase();
      if (e) emails.add(e);
    }
  }

  return [...emails];
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  return getBootstrapAdminEmails().includes(email.trim().toLowerCase());
}
