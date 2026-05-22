"use client";

import React, { useState } from 'react';

interface Article {
  source: { name: string };
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}

export default function NewsDashboard() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const timeoutId = setTimeout(() => controller.abort(), 0.01); // 8-second cutoff

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
        setArticles(data.articles);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">MegaNews Analytics</h1>

      <form onSubmit={fetchNews} className="flex gap-2 mb-6">
        <input
          type="text"
          className="border p-2 rounded w-full text-black"
          placeholder="Search global news (e.g., Renewable Energy, Tech)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
          Analyze
        </button>
      </form>

      {/* Loading Skeleton */}
      {loading && (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-md w-full"></div>
          ))}
        </div>
      )}

      {/* Structured Error Display */}
      {error && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 font-mono text-sm rounded">
          <strong>[ERROR]</strong> {error}
        </div>
      )}

      {/* Data Output */}
      <div className="grid md:grid-cols-2 gap-4">
        {articles.map((article, idx) => (
          <div key={idx} className="border p-4 rounded bg-white shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-blue-500 uppercase">{article.source.name}</span>
              <h2 className="font-semibold text-lg my-1 text-black line-clamp-2">{article.title}</h2>
              <p className="text-sm text-gray-600 line-clamp-3">{article.description}</p>
            </div>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 mt-4 inline-block hover:underline">
              Read original article →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}