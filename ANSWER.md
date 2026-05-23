---

### 2. `ANSWERS.md` Draft (Answering the 5 mandatory questions)

```markdown
# Technical Assessment Answers

### 1. How to run
Please refer explicitly to the copy-paste commands provided in the root `README.md` file.

### 2. Stack choice

* **Selected Stack:** Next.js (React) + TypeScript + TailwindCSS.
* **Why:** For an API dashboard, Next.js provides immediate client-side performance, fast components, and clean UI capability out of the box. TypeScript handles API payload validation predictably.
* **Worse Choice:** Vanilla PHP or Bash/cURL CLI scripts. Without structural framework states, writing modern UI components with robust data caching mechanisms, race-condition handling, and loading skeletons becomes messy and brittle.

### 3. One real edge case
* **Edge Case Handled:** API Unresponsiveness & Downward Latency..
* **Code Location:** `src/components/NewsDashboard.tsx`.
* **Explanation:** If NewsAPI encounters an internal network bottleneck and hangs, standard browser `fetch` calls can stay open indefinitely. I implemented an `AbortController` linked to an explicit 8-second `setTimeout`. If the response isn't resolved in 8 seconds, the connection aborts cleanly and exposes a descriptive user-friendly message, preventing an infinite loading state.

### 4. Honest gap

* **The Gap:** Client-side Key Exposure (Security Architecture limitation of Free Developer API Plan limits).
* **The Fix with another day:** Because NewsAPI's Developer Tier blocks incoming requests from deployed origins (due to strict CORS policies on the free plan), the app must call the endpoint from the browser runtime using `NEXT_PUBLIC_NEWS_API_KEY`. With an extra day, I would route this request internally through a Next.js API Route handler (`/api/news/route.ts`). This lets us sign requests strictly on the server-side architecture, concealing production keys completely from user inspection.
