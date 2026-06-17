'use client';

import { useState, useEffect } from 'react';
import VoteButton from '@/components/VoteButton';
import { GitPullRequest, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

interface PR {
  id: number;
  title: string;
  author: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  votes: number;
}

export default function PRFeed() {
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const { publicKey } = useWallet();

  useEffect(() => {
    // Mock data - replace with real API fetch
    const mockPRs: PR[] = [
      {
        id: 42,
        title: 'Add multi-signature support for transactions',
        author: '@dev_alice',
        url: 'https://github.com/vero/pr/42',
        status: 'pending',
        votes: 5,
      },
      {
        id: 43,
        title: 'Optimize smart contract gas fees',
        author: '@dev_bob',
        url: 'https://github.com/vero/pr/43',
        status: 'pending',
        votes: 3,
      },
      {
        id: 44,
        title: 'Implement rate limiting for API endpoints',
        author: '@dev_charlie',
        url: 'https://github.com/vero/pr/44',
        status: 'pending',
        votes: 8,
      },
    ];

    setTimeout(() => {
      setPrs(mockPRs);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading validation feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Pending Validations</h2>
        </div>
        <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium rounded-full border border-indigo-100 dark:border-indigo-800">
          {prs.length} PRs
        </span>
      </div>
      
      <div className="space-y-3">
        {prs.map((pr) => (
          <div key={pr.id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm hover:shadow-md group">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <a 
                  href={pr.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded flex items-center gap-2 group/link"
                  aria-label={`PR number ${pr.id}: ${pr.title}`}
                >
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-sm">#{pr.id}</span>
                  <span className="truncate">{pr.title}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                    {pr.author.charAt(1).toUpperCase()}
                  </div>
                  {pr.author}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{pr.votes} votes</span>
                </span>
              </div>
            </div>
            <div className="flex sm:justify-end">
              <VoteButton prId={pr.id} publicKey={publicKey} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
