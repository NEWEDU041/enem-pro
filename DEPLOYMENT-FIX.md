# SEO Fix — Deployment Instructions

**Issue:** Production serving `noindex, nofollow` while codebase has correct `index: true` settings.

**Root Cause:** Deployment mismatch — latest code commit not deployed to Vercel.

**Verification:** 
✅ Blog route code is correct (`app/blog/[slug]/page.tsx` loads from blog-data.ts)  
✅ Blog data exists (416 posts in lib/blog-data.ts, drafts in `.blog-memory/drafts/`)  
✅ Layout robots settings are correct (index: true, follow: true)  
✅ All quality gates passed (0 fabrications, proper schemas, readTime fixed)  

**Fix Checklist:**

- [ ] **Step 1:** Authenticate with Vercel
  ```bash
  vercel login
  # Enter email & verify in browser
  ```

- [ ] **Step 2:** Force redeploy latest commit
  ```bash
  cd /root/projetos/enem-pro
  vercel deploy --prod
  # OR if you have VERCEL_TOKEN env var set:
  vercel deploy --prod --token $VERCEL_TOKEN
  ```

- [ ] **Step 3:** Verify deployment (wait 2-3 minutes for build)
  - Check Vercel dashboard: https://vercel.com/dashboard/enem-pro
  - Confirm deploy shows commit `bcc6177` or newer
  - Check build logs for any errors

- [ ] **Step 4:** Test in production
  ```bash
  # Homepage should NOT be noindexed
  curl -s https://questoesenem.pro | grep robots
  # Should show: "index, follow" NOT "noindex"
  
  # Blog post should be accessible
  curl -sI https://questoesenem.pro/blog/local-de-prova-enem-2026
  # Should return: HTTP/2 200 (not 404)
  ```

- [ ] **Step 5:** Verify schema rendering
  ```bash
  curl -s https://questoesenem.pro/blog/local-de-prova-enem-2026 | grep BlogPosting
  # Should find BlogPosting schema in output
  ```

**Expected Result After Deploy:**
- ✅ Homepage indexed (robots: index, follow)
- ✅ Blog posts accessible (200 status, not 404)
- ✅ Blog post schema rendering (BlogPosting + FAQPage)
- ✅ Ready for Google Search Console re-indexation

**Next After Deploy:**
1. Submit to Google Search Console
2. Request re-indexation for 5-10 top blog posts
3. Monitor GSC for indexation progress (24-48 hours)

---

**Estimated Time:** 5-10 minutes deployment + 2-3 minutes verification = ~15 min total

**Questions?** See `/root/projetos/enem-pro/questoesenem-audit/ACTION-PLAN.md` for detailed recovery guide.
