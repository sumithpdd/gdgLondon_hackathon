# Firestore & Storage Rules

Security rules for Firebase services.

---

## Overview

- Firestore Database rules
- Firebase Storage rules
- Role-based access control
- Security best practices

---

## Deployment

**Use the rules from `firebase-rules.txt`** in the project root. Copy the contents to Firebase Console:

1. **Firestore:** Firebase Console → Firestore Database → Rules tab
2. **Storage:** Firebase Console → Storage → Rules tab

Do not copy rules from this documentation. The deployment file contains the correct configuration.

---

## Rule Structure (High-Level)

### User Profiles
- **Read:** Authenticated users
- **Create:** Self during signup
- **Update:** Owner or admin
- **Delete:** Admin only

### Project Submissions
- **Read:** Public (gallery)
- **Create:** Authenticated users
- **Update:** Authenticated (for engagement: likes, comment count)
- **Delete:** Owner or admin

### Project Comments (subcollection)
- **Read:** Public
- **Create:** Authenticated
- **Delete:** Comment author or admin

### User Bookmarks (subcollection)
- **Read/Write:** Owner only

### Community Discussions
- **Read:** Public
- **Create:** Authenticated
- **Update/Delete:** Author or admin

### Hackathon Updates
- **Read:** Public
- **Create/Update/Delete:** Admin only

### Storage (screenshots)
- **Read:** Public
- **Write:** Authenticated, size limit

### Event gallery (`eventPhotos` collection)
- **Read:** Public sees `status: approved` only; owners see their own docs; admins see all
- **Create (attendee):** **Not** via client SDK — use `reserveEventPhotoUpload` + `finalizeEventPhotoUpload` callables
- **Create (admin):** Client create allowed with `status: approved` only
- **Update / approve / sortOrder:** Admin only
- **Delete:** `withdrawEventPhoto` callable (admin any item; attendee pending only)

**Storage paths:** `event_photos/{hackathonId}/{uid}/{photoId}` (attendee) or admin flat path under same prefix. Images ≤ 10 MB; videos ≤ 50 MB. See [DATA_MODEL.md](./DATA_MODEL.md#event-gallery-media-io2026hackathon_eventphotos).

---

## Security Best Practices

- Always verify `request.auth != null` for writes
- Use `request.auth.uid` for owner checks
- Admin role stored in database, not client
- Validate file types and sizes
- Keep collection names in code, not docs

---

## Troubleshooting

### Permission denied
1. Verify rules are published
2. Check user is authenticated
3. Verify user role in Firestore
4. Use Rules playground to test

### Rules not taking effect
- Wait 1–2 minutes after publishing
- Clear cache, sign out and back in
