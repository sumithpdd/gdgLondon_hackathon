# Firebase Setup & Troubleshooting

Quick guide to fix common Firebase issues.

---

## 🔥 Update Firebase Storage Rules

**IMPORTANT**: The app saves screenshots in the configured storage folder (see `lib/constants.ts`).

### Steps:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Storage** in left sidebar
4. Click **Rules** tab
5. **Replace** with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /hackathon_uploads/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null 
                   && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

6. Click **Publish**
7. Wait 10 seconds for rules to propagate

---

## 🔧 Firestore Rules

Make sure Firestore rules are also correct:

1. Go to **Firestore Database** in left sidebar
2. Click **Rules** tab
3. **Replace** with this:

Use the Firestore rules from `firebase-rules.txt` in the project root. Do not copy rules from documentation—use the deployment file.

4. Click **Publish**

---

## ❌ Common Errors & Solutions

### Error: "Storage permission denied"

**Cause**: Firebase Storage rules not updated

**Fix**:
1. Update Storage rules (see above)
2. Ensure the storage path matches your constants
3. Click Publish
4. Wait 10 seconds
5. Try again

### Error: "Database permission denied"

**Cause**: Firestore rules incorrect

**Fix**:
1. Update Firestore rules (see above)
2. Collection name must be `projects`
3. Click Publish
4. Try again

### Error: "Failed to upload screenshots"

**Possible Causes**:
- Internet connection issue
- File too large (max 10MB)
- Storage rules not set
- Not signed in

**Fix**:
1. Check internet connection
2. Verify file size < 10MB
3. Make sure you're signed in
4. Update Storage rules
5. Try again

### Error: "Authentication required"

**Cause**: Not signed in to Clerk

**Fix**:
1. Click "Sign In" button
2. Create account or sign in
3. Try submitting again

---

## ✅ Quick Test

After updating rules, test:

```bash
1. Sign in to the app
2. Go to /submit
3. Fill form
4. Upload 1 image
5. Click "Submit Project"
6. Should succeed!
```

---

## 🔍 Check Firebase Console

### Verify Storage:
1. Go to **Storage** → **Files**
2. Should see `hackathon_uploads` folder
3. Uploaded images should be inside

### Verify Firestore:
1. Go to **Firestore Database** → **Data**
2. Should see `projects` collection
3. Documents should appear after submission

---

## 🆘 Still Having Issues?

### Check Browser Console:
1. Press F12 (Developer Tools)
2. Go to Console tab
3. Look for red errors
4. Share error message

### Check Firebase Logs:
1. Firebase Console → Project Overview
2. Click gear icon → Usage and billing
3. Check for error logs

### Common Issues:

**"No user signed in"**
- Sign out and sign in again
- Clear browser cookies
- Check Firebase Auth

**"Network error"**
- Check internet connection
- Disable VPN
- Try different browser

**"Quota exceeded"**
- Check Firebase usage limits
- Upgrade to Blaze plan if needed

---

## 📝 Environment Variables

Make sure `.env.local` has correct values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123
```

**Verify**:
- Storage bucket matches your Firebase project
- No typos in any value
- No extra spaces

---

## 🔄 After Changes

After updating rules or env variables:

```bash
# Stop dev server (Ctrl+C)
# Restart
npm run dev

# Or if that doesn't work:
rm -rf .next
npm run dev
```

---

## ✅ Success Checklist

- [x] Storage rules updated with `hackathon_uploads` folder
- [x] Firestore rules updated
- [x] Rules published (not just saved)
- [x] Waited 10 seconds after publish
- [x] User is signed in
- [x] Environment variables correct
- [x] Dev server restarted
- [x] Internet connection working

---

**After following these steps, submission should work!** 🎉

Need more help? Check console logs or open GitHub issue.

