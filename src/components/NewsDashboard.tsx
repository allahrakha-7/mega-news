"use client";

import React, { useState, useEffect, useMemo } from 'react';

interface Article {
  source: { name: string };
  author?: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage?: string | null;
  publishedAt: string;
  content?: string | null;
}

const PRESET_KEYWORDS = [
  "Artificial Intelligence",
  "Software Engineering",
  "Space Exploration",
  "Global Markets",
  "Machine Learning",
  "Cybersecurity",
  "Productivity",
  "Web Development"
];

export default function NewsDashboard() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom features states
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<'explore' | 'bookmarks'>('explore');
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Load Bookmarks and Theme on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBookmarks = localStorage.getItem('mega_news_bookmarks');
      if (savedBookmarks) {
        try {
          setBookmarkedArticles(JSON.parse(savedBookmarks));
        } catch (e) {
          console.error("Failed to parse bookmarks", e);
        }
      }

      const savedTheme = localStorage.getItem('mega_news_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    }
  }, []);

  // Save Bookmarks when they change
  const saveBookmarks = (newBookmarks: Article[]) => {
    setBookmarkedArticles(newBookmarks);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mega_news_bookmarks', JSON.stringify(newBookmarks));
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mega_news_theme', nextTheme);
    }
  };

  const toggleBookmark = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    const isBookmarked = bookmarkedArticles.some(item => item.url === article.url);
    if (isBookmarked) {
      saveBookmarks(bookmarkedArticles.filter(item => item.url !== article.url));
    } else {
      saveBookmarks([...bookmarkedArticles, article]);
    }
  };

  const shareArticle = (url: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Helper to run query from preset pills
  const handlePresetClick = (keyword: string) => {
    setQuery(keyword);
    // Trigger search
    setTimeout(() => {
      const form = document.getElementById('search-form') as HTMLFormElement;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 50);
  };

  const fetchNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setArticles([]);

    // 1. Edge Case: User Giving Bad Input (Empty or only spaces)
    const sanitizedQuery = query.trim();
    if (!sanitizedQuery) {
      setError("Input validation failed: Please enter a valid topic or keyword.");
      return;
    }

    setLoading(true);

    try {
      // 2. Edge Case: Slow API / Request Timeout (AbortController)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second cutoff

      const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(sanitizedQuery)}&pageSize=12&apiKey=${apiKey}`;

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      // 3. Edge Case: API Returning Errors (401 Unauthorized, 429 Rate Limited, 500 Server Error)
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API Key. Please check your .env.local file configuration.");
        } else if (response.status === 429) {
          throw new Error("NewsAPI Developer plan rate limit reached (100 requests/day max). Please wait.");
        } else {
          throw new Error(`Server Error: Received status code ${response.status} from NewsAPI.`);
        }
      }

      const data = await response.json();

      if (data.articles.length === 0) {
        setError("No articles found for this topic. Try a broader keyword.");
      } else {
        // Filter out removed or broken articles
        const cleanArticles = data.articles.filter((art: any) => art.title && art.title !== "[Removed]");
        if (cleanArticles.length === 0) {
          setError("No articles found for this topic. Try a broader keyword.");
        } else {
          setArticles(cleanArticles);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError("The external NewsAPI took too long to respond. Please check your network connection and retry.");
      } else {
        setError(err.message || "An unexpected system error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine current active cards to display
  const currentArticles = activeTab === 'explore' ? articles : bookmarkedArticles;

  return (
    <div className={theme}>
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-[#070b13] dark:text-slate-100 font-sans pb-24 relative overflow-hidden">

        {/* Glow Gradients */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 dark:bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[40%] right-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Decorative Grid Layer */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Header Section */}
        <header className="sticky top-0 z-30 backdrop-blur-lg bg-white/70 dark:bg-[#070b13]/70 border-b border-slate-200/80 dark:border-slate-800/80 ">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
            <div className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">
              MEGA NEWS
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Tab Toggler */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'explore'
                    ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  Explore
                </button>
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'bookmarks'
                    ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  Bookmarks
                  {bookmarkedArticles.length > 0 && (
                    <span className="bg-blue-600 dark:bg-indigo-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-pulse">
                      {bookmarkedArticles.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Theme Selector */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all duration-200 cursor-pointer"
                title="Toggle Theme Mode"
              >
                {theme === "light" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828 0l-.707-.707m12.728-12.728l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Container */}
        <main className="max-w-7xl mx-auto px-6 mt-12 relative z-10">

          {/* Active Header Section */}
          {activeTab === 'explore' ? (
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h1 className="text-2xl font-extrabold tracking-wide sm:text-4xl">
                <p className="dark:text-white text-slate-900">Aggregate real-time global </p>
                <p className="dark:text-white text-slate-900">intelligence. Analyze breaking news across tech, markets, climate, and sciences instantly</p>
              </h1>
            </div>
          ) : (
            <div className="text-left max-w-3xl mb-25">

            </div>
          )}

          {/* Search Form and suggestion pills (Only show in Explore tab) */}
          {activeTab === 'explore' && (
            <div className="max-w-3xl mx-auto mb-12">
              <form id="search-form" onSubmit={fetchNews} className="relative group">
                <div className="relative flex items-center bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-md">
                  <div className="pl-5 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full px-4 py-4 focus:outline-none text-slate-900 dark:text-white bg-transparent text-base placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="Search global news topics (e.g., Quantum Computing, Carbon Capture)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <div className="pr-3 flex items-center gap-2">
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Preset suggestion pills */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center items-center">
                <span className="text-xs text-slate-400 mr-1">Suggestions:</span>
                {PRESET_KEYWORDS.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => handlePresetClick(kw)}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200/50 dark:border-slate-800/40 transition-all cursor-pointer"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Skeleton View */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/40 p-6 space-y-4 animate-pulse">
                  <div className="bg-slate-200 dark:bg-slate-800 h-44 rounded-xl w-full" />
                  <div className="space-y-2">
                    <div className="bg-slate-200 dark:bg-slate-800 h-4 rounded w-1/4" />
                    <div className="bg-slate-200 dark:bg-slate-800 h-6 rounded w-3/4" />
                    <div className="bg-slate-200 dark:bg-slate-800 h-4 rounded w-full" />
                    <div className="bg-slate-200 dark:bg-slate-800 h-4 rounded w-full" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="bg-slate-200 dark:bg-slate-800 h-8 rounded w-1/3" />
                    <div className="bg-slate-200 dark:bg-slate-800 h-8 rounded w-8" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Structured Error Display */}
          {error && !loading && (
            <div className="max-w-2xl mx-auto my-8 p-6 bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/30 rounded-lg shadow-sm animate-fade-in">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-red-800 dark:text-red-400 text-base">
                    Analysis Error Intercepted
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed font-mono">
                    {error}
                  </p>
                  {error.includes("API Key") && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Tip: Create a file named <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-red-500">.env.local</code> in your project root, add <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-green-500">NEXT_PUBLIC_NEWS_API_KEY=your_key_here</code>, and restart your server.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty Bookmarks View */}
          {activeTab === 'bookmarks' && bookmarkedArticles.length === 0 && (
            <div className="max-w-md mx-auto text-center py-16 px-6 border border-slate-200/80 dark:border-slate-800/80 rounded-lg bg-white dark:bg-slate-900/10">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">No saved articles yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                When exploring news, click the bookmark icon on any card to save it here for reference.
              </p>
              <button
                onClick={() => setActiveTab('explore')}
                className="mt-6 bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Explore News
              </button>
            </div>
          )}

          {/* Empty Explore View */}
          {activeTab === 'explore' && articles.length === 0 && !loading && !error && (
            <div className="max-w-md mx-auto text-center py-10 px-6">
              <h3 className="text-xl font-bold flex items-center justify-center gap-1">Awaiting Exploration <span className="w-6 h-6 text-blue-500 dark:text-indigo-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6m-6 4h12" />
                </svg>
              </span></h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Type a topic above or select one of the suggested keywords to fetch and analyze real-time worldwide articles.
              </p>
            </div>
          )}

          {/* Cards Grid */}
          {!loading && currentArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentArticles.map((article, idx) => (
                <article
                  key={idx}
                  onClick={() => setActiveArticle(article)}
                  className="group flex flex-col justify-between bg-white dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-indigo-500/5 hover:border-blue-500/40 dark:hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
                >
                  <div>
                    {/* Header Image with Fallback */}
                    <div className="h-48 overflow-hidden relative bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                      {article.urlToImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={article.urlToImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-slate-200 via-slate-100 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex flex-col items-center justify-center p-4">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase mb-1">
                            {article.source.name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            No Preview Image
                          </span>
                        </div>
                      )}

                      {/* Top Overlay Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/95 text-blue-600 dark:bg-[#070b13]/95 dark:text-indigo-400 shadow-sm border border-slate-200/20">
                          {article.source.name}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 font-semibold">
                        <span>
                          {article.publishedAt
                            ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                            : 'Date Unknown'}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 leading-snug">
                        {article.title}
                      </h3>

                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {article.description || "No summary description available. Click to read the full context."}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/30 mt-4">
                    <span className="text-xs text-blue-600 dark:text-indigo-400 font-bold hover:underline">
                      Read Details →
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Share Button */}
                      <button
                        onClick={(e) => shareArticle(article.url, idx, e)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                        title="Copy article link"
                      >
                        {copiedIndex === idx ? (
                          <span className="text-[10px] text-green-500 font-bold px-1 animate-fade-in">Copied!</span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742L19.9 5.133a1 1 0 011.4 1.285l-4.7 11.5a1 1 0 01-1.7.078l-4-5.3a1 1 0 010-1.285z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12H3m14 0h-2m-4-8v2m0 12v2" />
                          </svg>
                        )}
                      </button>

                      {/* Bookmark toggle */}
                      <button
                        onClick={(e) => toggleBookmark(article, e)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/40 dark:hover:bg-indigo-950/40 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        title="Bookmark"
                      >
                        <svg
                          className={`w-4 h-4 ${bookmarkedArticles.some(item => item.url === article.url)
                            ? "fill-blue-600 text-blue-600 dark:fill-indigo-400 dark:text-indigo-400"
                            : ""
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        {/* Modal Window: Immersive Detail Read-Viewer */}
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            {/* Modal Overlay backdrop */}
            <div
              onClick={() => setActiveArticle(null)}
              className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
            />

            {/* Modal Content Box */}
            <div className="bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-slate-800/80 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col no-scrollbar">

              {/* Cover image in details view */}
              <div className="h-60 md:h-80 relative overflow-hidden w-full flex-shrink-0 bg-slate-100 dark:bg-slate-950">
                {activeArticle.urlToImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeArticle.urlToImage}
                    alt={activeArticle.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-200 via-slate-100 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase">
                      {activeArticle.source.name}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0e1422] via-transparent to-transparent" />

                {/* Close Button */}
                <button
                  onClick={() => setActiveArticle(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950/85 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                  title="Close Dialog"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Core Body Content */}
              <div className="p-6 md:p-10 pt-4 flex-1">

                {/* Meta details & accessibility config */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                      {activeArticle.source.name}
                    </span>
                    <span>
                      {activeArticle.publishedAt
                        ? new Date(activeArticle.publishedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : 'Date Unknown'}
                    </span>
                  </div>

                  {/* Accessibility font-resizer control */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase select-none">Text</span>
                    <button
                      onClick={() => setTextSize('sm')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${textSize === 'sm' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setTextSize('md')}
                      className={`px-2 py-0.5 rounded text-xs font-bold ${textSize === 'md' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setTextSize('lg')}
                      className={`px-2 py-0.5 rounded text-sm font-bold ${textSize === 'lg' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      A
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
                  {activeArticle.title}
                </h2>

                {/* Author Credit if available */}
                {activeArticle.author && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
                    <span className="font-bold">Reported By:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40">
                      {activeArticle.author}
                    </span>
                  </div>
                )}

                {/* Description Summary */}
                <p className="text-base font-medium text-slate-800 dark:text-slate-200 italic border-l-4 border-blue-500 dark:border-indigo-500 pl-4 mb-6 leading-relaxed">
                  {activeArticle.description}
                </p>

                {/* Content segment */}
                <div className={`text-slate-600 dark:text-slate-300 leading-relaxed mb-8 ${textSize === 'sm' ? 'text-xs' : textSize === 'lg' ? 'text-lg' : 'text-sm md:text-base'
                  }`}>
                  {activeArticle.content ? (
                    // Truncate the truncated part that NewsAPI appends e.g., "... [+2033 chars]" and present a beautiful context
                    activeArticle.content.replace(/ \[\+\d+ chars\]$/, "") +
                    " [Content summary from NewsAPI. Click below to continue reading complete reporting on original platform.]"
                  ) : (
                    "No detailed text segment was provided by the API endpoint. You can view the complete original article layout directly on the publisher's platform using the connection link below."
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-8">
                  {/* Bookmark State in Modal */}
                  <button
                    onClick={(e) => toggleBookmark(activeArticle, e)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <svg
                      className={`w-4 h-4 ${bookmarkedArticles.some(item => item.url === activeArticle.url)
                        ? "fill-blue-600 text-blue-600 dark:fill-indigo-400 dark:text-indigo-400"
                        : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {bookmarkedArticles.some(item => item.url === activeArticle.url) ? 'Saved in Bookmarks' : 'Save to Bookmarks'}
                  </button>

                  {/* External Outbound Link */}
                  <a
                    href={activeArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg"
                  >
                    Read Full Article on Publisher Platform
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}