"use client";
import { useState, useEffect } from "react";
import { Link2, Send, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import type { UserStats } from "@/types";

export default function SubmitClient() {
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/links")
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.stats); });
  }, []);

  const isLimitReached = stats ? stats.remaining <= 0 : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.split("\n").some(l => l.trim())) return;
    setSubmitting(true);

     const links = link
  .split(/\r?\n/)
  .map(l =>
    l
      .trim()
      .replace(/^"+|"+$/g, "") // remove quotes
      .replace(/\t/g, "")      // remove tabs from Sheets
  )
  .filter(Boolean);

    try {
      const res = await fetch("/api/user/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to submit link");
      } else {
        toast.success("Link submitted successfully!");
        setLastSubmitted(link.trim());
        setLink("");
        // Refresh stats
        const statsRes = await fetch("/api/user/links");
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      {/* Stats bar */}
      {stats && (
        <div className="card p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-surface-500">Submissions used</span>
              <span className="font-semibold font-mono text-surface-700">
                {stats.totalSubmitted} / {stats.submissionLimit}
              </span>
            </div>
            <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stats.remaining === 0 ? "bg-red-500" :
                  stats.remaining <= 10 ? "bg-amber-500" : "bg-brand-500"
                }`}
                style={{ width: `${Math.min(100, (stats.totalSubmitted / stats.submissionLimit) * 100)}%` }}
              />
            </div>
          </div>
          <div className={`text-right flex-shrink-0 ${stats.remaining === 0 ? "text-red-600" : "text-brand-600"}`}>
            <p className="text-xl font-bold font-mono">{stats.remaining}</p>
            <p className="text-xs">remaining</p>
          </div>
        </div>
      )}

      {/* Limit reached banner */}
      {isLimitReached && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Submission limit reached</p>
            <p className="text-sm text-red-600 mt-0.5">
              You&apos;ve used all {stats?.submissionLimit} of your available submissions. Contact the admin to increase your limit.
            </p>
          </div>
        </div>
      )}

      {/* Submit Form */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <Link2 className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-semibold text-surface-900">Submit a Link</h2>
            <p className="text-xs text-surface-500">Enter a valid URL starting with http:// or https://</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              URL
            </label>
            <textarea
              value={link}
              onChange={e => setLink(e.target.value)}
              rows={15}
              placeholder={`https://site1.com
                https://site2.com
                https://site3.com`}
              className="input-field font-mono text-sm w-full"
              disabled={isLimitReached || submitting}
              required
            />
            <p className="text-xs text-surface-400 mt-1.5">
              Paste one URL per line. Maximum 100 links at once.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLimitReached || submitting || !link.trim()}
            className="btn-primary w-full"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Link
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Last submitted */}
      {lastSubmitted && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-emerald-800 text-sm">Successfully submitted!</p>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-xs text-emerald-600 font-mono truncate">{lastSubmitted}</p>
              <a href={lastSubmitted} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-700 flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
