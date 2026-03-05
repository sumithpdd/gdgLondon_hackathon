# Quick Troubleshooting

Common issues and quick fixes.

> **Upload failing?** See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for Storage rules and fixes.

---

## 🔥 "Failed to submit" / "Failed to upload screenshots" Error

### Quick Fix:

**1. Update Firebase Storage Rules** (Most common issue)

Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Storage → Rules:

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

Click **Publish** → Wait 10 seconds → Try again

**2. Check You're Signed In**
- Look for your profile picture in top right
- If not signed in, click "Sign In"

**3. Check Internet Connection**
- Refresh page
- Try again

**4. Check File Size**
- Each image must be < 10MB
- Remove large files and try again

---

## 🔑 Authentication Issues

### "Authentication required" message

**Fix**: Sign in first
1. Click "Sign In" button
2. Create account or log in
3. Go back to submit page

### Can't sign in

**Fix**:
1. Clear browser cookies
2. Try incognito mode
3. Check Clerk dashboard is working

---

## 📸 Image Upload Issues

### Images won't upload

**Check**:
- File size < 10MB per image
- Max 5 images total
- Image format: JPG, PNG, GIF, WebP
- You're signed in

**Fix**:
1. Compress large images
2. Try uploading one at a time
3. Check browser console (F12) for errors

---

## 🔧 Port Already in Use

### "Port 3000 in use" error

**Fix (PowerShell)**:
```powershell
Get-Process -Name node | Stop-Process -Force
npm run dev
```

---

## 💾 Draft Not Loading

### Can't find your draft

**Reasons**:
- Different account
- Draft was submitted
- Browser cache cleared

**Check**:
1. Make sure you're signed in with same account
2. Check gallery - it might be submitted
3. Submit a new one

---

## 🏆 Admin Panel Issues

### Can't access /admin

**Fix**:
1. Go to `/admin/login` first
2. Username: `admin`
3. Password: `admin`
4. Then access `/admin`

### Session expired

**Fix**:
- Session lasts 24 hours
- Just login again at `/admin/login`

---

## 🌐 Deploy Issues

### Build fails on Vercel

**Fix**:
1. Test build locally: `npm run build`
2. Fix any TypeScript errors
3. Push changes
4. Redeploy

### Environment variables not working

**Fix**:
1. Add ALL variables in Vercel Dashboard
2. Select "Production", "Preview", "Development"
3. Redeploy

---

## 🔍 Debug Steps

### When something doesn't work:

1. **Check Browser Console** (F12)
   - Look for red errors
   - Copy error message

2. **Check You're Signed In**
   - Profile picture showing?
   - Try signing out and in

3. **Check Firebase Rules**
   - Storage rules updated?
   - Firestore rules updated?
   - Click Publish?

4. **Restart Dev Server**
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

5. **Clear Cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

---

## 📋 Quick Checklist

Before submitting:
- [ ] Signed in to app
- [ ] Firebase Storage rules updated
- [ ] Firebase Firestore rules updated
- [ ] Internet connection working
- [ ] Images < 10MB each
- [ ] Max 5 images
- [ ] GitHub URL is valid

---

## 🆘 Still Stuck?

1. Check detailed guide: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. Check console errors (F12)
3. Open GitHub issue with:
   - Error message
   - Screenshots
   - What you tried

---

**Most issues are fixed by updating Firebase Storage rules!**

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions.

