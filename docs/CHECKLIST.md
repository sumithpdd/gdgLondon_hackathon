# Pre-Deployment Checklist

Use this checklist before deploying to production.

---

## ✅ Setup Checklist

### Local Development

- [ ] All dependencies installed (`npm install`)
- [ ] `.env.local` configured with all keys
- [ ] App runs locally without errors (`npm run dev`)
- [ ] All pages load correctly
- [ ] Authentication works (sign in/sign out)
- [ ] Submission form works
- [ ] File upload works
- [ ] Admin panel accessible

### Firebase Configuration

- [ ] Firebase project created
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Firestore rules updated (from `firebase-rules.txt`)
- [ ] Storage rules updated (from `firebase-rules.txt`)
- [ ] Collection `hackatonProjects` exists (created on first submission)
- [ ] Collection `hackatonUsers` exists (created on first sign-in)
- [ ] Folder `hackathon_uploads` accessible

### Firebase Auth Configuration

- [ ] Authentication enabled (Email/Password + Google)
- [ ] Authorized domains include `localhost` and production URL

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] `.env.local` NOT in repository (check `.gitignore`)
- [ ] All sensitive data removed from code
- [ ] Admin credentials reviewed (change from `admin/admin`)
- [ ] README.md updated
- [ ] Documentation complete

### Vercel Setup

- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] All environment variables added in Vercel Dashboard
- [ ] Build settings correct (Next.js framework auto-detected)
- [ ] Deployment successful

### Post-Deployment

- [ ] Production URL accessible
- [ ] Firebase Auth domain added (your-app.vercel.app)
- [ ] Firebase authorized domain added
- [ ] Test authentication on production
- [ ] Test submission form on production
- [ ] Test file upload on production
- [ ] Test admin login on production
- [ ] Test gallery view on production

---

## 🔒 Security Checklist

### Critical Items

- [ ] **Admin password changed** (app/admin/login/page.tsx)
- [ ] All API keys in environment variables
- [ ] `.env.local` in `.gitignore`
- [ ] Firebase rules properly configured
- [ ] Clerk authentication working
- [ ] No hardcoded secrets in code

### Recommended

- [ ] Enable Clerk MFA (Multi-Factor Authentication)
- [ ] Set up Firebase Auth (in addition to Clerk)
- [ ] Configure rate limiting in Vercel
- [ ] Enable Vercel password protection (if needed)
- [ ] Set up monitoring/analytics

---

## 🧪 Testing Checklist

### Functionality Tests

- [ ] Home page loads
- [ ] Sign in works
- [ ] Sign up works
- [ ] Sign out works
- [ ] Submit form renders
- [ ] Draft save works
- [ ] Draft load works
- [ ] Screenshot upload works (up to 5 files)
- [ ] Form validation works
- [ ] Submission succeeds
- [ ] Gallery shows submissions
- [ ] Admin login works
- [ ] Admin can view submissions
- [ ] Admin can select winners
- [ ] Winner badges display correctly

### Browser Tests

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile (responsive)

### Performance Tests

- [ ] Page load < 3 seconds
- [ ] Images optimized
- [ ] No console errors
- [ ] No console warnings (development)

---

## 📊 Post-Launch Checklist

### Monitoring

- [ ] Check Vercel analytics
- [ ] Monitor Firebase usage
- [ ] Monitor Clerk usage
- [ ] Check for errors in logs
- [ ] Test from different devices

### Documentation

- [ ] Update README with production URL
- [ ] Document any issues found
- [ ] Create user guide (if needed)
- [ ] Update FAQ (if needed)

### Maintenance

- [ ] Set up backup strategy for Firebase
- [ ] Plan for scaling (if needed)
- [ ] Schedule security reviews
- [ ] Plan for updates

---

## ⚠️ Common Issues & Fixes

### Build Fails

**Issue**: Missing environment variables  
**Fix**: Add all variables in Vercel Dashboard

### Authentication Error

**Issue**: Clerk domain not whitelisted  
**Fix**: Add production URL to Clerk allowed origins

### Upload Error

**Issue**: Firebase Storage rules incorrect  
**Fix**: Update rules in Firebase Console

### Permission Denied

**Issue**: Firestore rules incorrect  
**Fix**: Copy rules from `firebase-rules.txt`

---

## 📞 Support Resources

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Firebase**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Clerk**: [clerk.com/docs](https://clerk.com/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)

---

## ✨ Final Check

Before going live:

```bash
# Run build locally
npm run build

# Test production build
npm run start

# Check for any errors
```

---

**Ready to deploy?** → See [DEPLOYMENT.md](DEPLOYMENT.md)

🎉 **Good luck with your launch!**

