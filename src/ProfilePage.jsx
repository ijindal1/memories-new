import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSession, useUser, Descope } from "@descope/react-sdk";
import posthog from "posthog-js";

import { getProfile, getProfileShareLink } from "./lib/api.js";
import { generateProfileSummary, EXPLORATION_LABELS, INTENT_LABELS } from "./lib/profile.js";
import { generateSkill } from "./skills/generateSkill.js";
import { downloadSkill } from "./skills/packageSkill.js";

const ALL_APPS = [
  { slug: "fig", name: "fig", tagline: "How your brain wants information" },
  { slug: "reed", name: "reed", tagline: "Find your voice so AI can use it" },
  { slug: "tandem", name: "tandem", tagline: "A user manual for your partnership" },
  { slug: "compass", name: "compass", tagline: "Understand how you actually decide" },
];

export default function ProfilePage() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);
  const [copiedApp, setCopiedApp] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    if (isSessionLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    posthog.capture("profile_viewed");
    getProfile()
      .then((data) => {
        setProfile(data.profile);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile");
        setLoading(false);
      });
  }, [isAuthenticated, isSessionLoading]);

  const handleCopy = async (prompt, slug) => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedApp(slug);
    posthog.capture("prompt_copied", { app_slug: slug, source: "profile" });
    setTimeout(() => setCopiedApp(null), 2000);
  };

  const handleDownload = (dimensions, slug) => {
    const skillContent = generateSkill(dimensions);
    downloadSkill(skillContent);
    posthog.capture("skill_downloaded", { app_slug: slug, source: "profile" });
  };

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const data = await getProfileShareLink();
      const url = `${window.location.origin}/p/${data.token}`;
      setShareUrl(url);
      posthog.capture("profile_shared");
    } catch {
      setShareUrl(null);
    }
    setShareLoading(false);
  };

  const handleShareCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  if (loading || isSessionLoading) {
    return (
      <div className="pp-root">
        <style>{profileStyles}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p className="pp-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pp-root">
        <style>{profileStyles}</style>
        <nav className="pp-nav">
          <Link to="/" className="pp-wordmark">memories.new</Link>
        </nav>
        <div style={{ maxWidth: 400, margin: "120px auto", textAlign: "center", padding: "0 24px" }}>
          <h1 className="pp-heading" style={{ marginBottom: 12 }}>Sign in to view your profile</h1>
          <p className="pp-secondary" style={{ marginBottom: 32 }}>
            Take a quiz and sign in to save your results here.
          </p>
          <Link to="/" className="pp-btn-secondary">Back to home</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-root">
        <style>{profileStyles}</style>
        <nav className="pp-nav">
          <Link to="/" className="pp-wordmark">memories.new</Link>
        </nav>
        <div style={{ maxWidth: 400, margin: "120px auto", textAlign: "center" }}>
          <p className="pp-secondary">{error}</p>
        </div>
      </div>
    );
  }

  // Build lookup of completed apps
  const completedMap = {};
  if (profile?.apps) {
    for (const app of profile.apps) {
      completedMap[app.app_slug] = app;
    }
  }

  return (
    <div className="pp-root">
      <style>{profileStyles}</style>

      <nav className="pp-nav">
        <Link to="/" className="pp-wordmark">memories.new</Link>
        <div className="pp-nav-right">
          <span className="pp-secondary" style={{ fontSize: 14 }}>
            {user?.email || "Signed in"}
          </span>
        </div>
      </nav>

      <div className="pp-container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <h1 className="pp-heading" style={{ margin: 0 }}>Your Discoveries</h1>
          <button
            className="pp-btn-secondary"
            onClick={handleShare}
            disabled={shareLoading}
            style={{ fontSize: 13, whiteSpace: "nowrap" }}
          >
            {shareLoading ? "Generating..." : "Share profile"}
          </button>
        </div>
        <p className="pp-secondary" style={{ marginTop: 8, marginBottom: shareUrl ? 16 : 40 }}>
          Everything you've learned about yourself across memories.new
        </p>

        {shareUrl && (
          <div className="pp-share-bar" style={{ marginBottom: 40 }}>
            <input
              className="pp-share-input"
              type="text"
              value={shareUrl}
              readOnly
              onFocus={(e) => e.target.select()}
            />
            <button className="pp-btn-primary" onClick={handleShareCopy} style={{ whiteSpace: "nowrap" }}>
              {shareCopied ? "Copied \u2713" : "Copy link"}
            </button>
          </div>
        )}

        <div className="pp-cards">
          {ALL_APPS.map((app) => {
            const completed = completedMap[app.slug];
            const isExpanded = expandedApp === app.slug;

            if (!completed) {
              return (
                <div key={app.slug} className="pp-card pp-card-coming-soon">
                  <div className="pp-card-header">
                    <div>
                      <h2 className="pp-card-name">{app.name}</h2>
                      <p className="pp-card-tagline">{app.tagline}</p>
                    </div>
                    <span className="pp-badge-soon">Coming soon</span>
                  </div>
                </div>
              );
            }

            const result = completed.latest_result;
            const dimensions = typeof result.dimensions === "string"
              ? JSON.parse(result.dimensions)
              : result.dimensions;
            const summary = generateProfileSummary(dimensions);
            const takenDate = new Date(result.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });

            return (
              <div key={app.slug} className="pp-card pp-card-completed">
                <div
                  className="pp-card-header pp-card-header-clickable"
                  onClick={() => setExpandedApp(isExpanded ? null : app.slug)}
                >
                  <div>
                    <h2 className="pp-card-name">{app.name}</h2>
                    <p className="pp-card-tagline">{app.tagline}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="pp-badge-done">Completed</span>
                    <span className="pp-expand-icon">{isExpanded ? "\u2212" : "\u002B"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pp-card-body">
                    <div className="pp-card-meta">
                      Taken {takenDate}
                      {completed.attempts > 1 && ` \u00b7 ${completed.attempts} attempts`}
                    </div>

                    <div className="pp-summary">
                      <p className="pp-summary-headline">{summary.headline}</p>
                      {summary.details.map((d, i) => (
                        <p key={i} className="pp-summary-detail">{d}</p>
                      ))}
                    </div>

                    <div className="pp-dimensions">
                      {[
                        { label: "Density", value: dimensions.density, low: "Spacious", high: "Dense" },
                        { label: "Confidence", value: dimensions.confidence, low: "Supportive", high: "Self-directed" },
                        { label: "Tone", value: dimensions.tone, low: "Warm", high: "Clinical" },
                        { label: "Engagement", value: dimensions.engagement, low: "Absorb", high: "Challenge" },
                        { label: "Candor", value: dimensions.candor, low: "Gentle", high: "Unfiltered" },
                      ].map(dim => (
                        <div key={dim.label} className="pp-dim-row">
                          <div className="pp-dim-labels">
                            <span>{dim.low}</span>
                            <span className="pp-dim-name">{dim.label}</span>
                            <span>{dim.high}</span>
                          </div>
                          <div className="pp-dim-track">
                            <div
                              className="pp-dim-dot"
                              style={{ left: `${((dim.value - 1) / 4) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="pp-dim-categories">
                        <div>
                          <span className="pp-dim-cat-label">Exploration</span>
                          <span className="pp-dim-cat-value">{EXPLORATION_LABELS[dimensions.exploration]}</span>
                        </div>
                        <div>
                          <span className="pp-dim-cat-label">Intent</span>
                          <span className="pp-dim-cat-value">{INTENT_LABELS[dimensions.intent]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pp-actions">
                      <button
                        className="pp-btn-primary"
                        onClick={() => handleCopy(result.generated_prompt, app.slug)}
                      >
                        {copiedApp === app.slug ? "Copied \u2713" : "Copy prompt"}
                      </button>
                      <button
                        className="pp-btn-accent"
                        onClick={() => handleDownload(dimensions, app.slug)}
                      >
                        Download .skill
                      </button>
                      <Link to={`/${app.slug}`} className="pp-btn-secondary">
                        Retake quiz {"\u2192"}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const profileStyles = `
  .pp-root {
    --canvas: #0C0B0E;
    --surface: #16151A;
    --elevated: #1E1D24;
    --border: rgba(240, 237, 232, 0.12);
    --border-strong: rgba(240, 237, 232, 0.2);
    --text-primary: #F0EDE8;
    --text-secondary: #9B97A8;
    --text-tertiary: #5C5869;
    --accent: #D94F7A;
    --green: #8BC49E;
    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans: 'DM Sans', -apple-system, sans-serif;

    min-height: 100vh;
    background: var(--canvas);
    color: var(--text-primary);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  .pp-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px 32px;
  }
  .pp-wordmark {
    font-family: var(--font-serif);
    font-size: 22px;
    color: var(--text-primary);
    text-decoration: none;
  }
  .pp-nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .pp-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 32px 80px;
  }

  .pp-heading {
    font-family: var(--font-serif);
    font-size: 36px;
    font-weight: 400;
    color: var(--text-primary);
    margin: 0 0 8px;
  }
  .pp-secondary {
    color: var(--text-secondary);
    font-size: 16px;
    line-height: 1.5;
    margin: 0;
  }

  .pp-cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pp-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .pp-card-completed {
    border-color: var(--border-strong);
  }

  .pp-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    gap: 16px;
  }
  .pp-card-header-clickable {
    cursor: pointer;
    transition: background 0.15s;
  }
  .pp-card-header-clickable:hover {
    background: var(--surface);
  }

  .pp-card-name {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 400;
    color: var(--text-primary);
    margin: 0 0 2px;
  }
  .pp-card-coming-soon .pp-card-name {
    color: var(--text-secondary);
  }
  .pp-card-tagline {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }
  .pp-card-coming-soon .pp-card-tagline {
    color: var(--text-tertiary);
  }

  .pp-badge-soon {
    font-size: 11px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .pp-badge-done {
    font-size: 11px;
    color: var(--green);
    background: rgba(91, 138, 110, 0.12);
    border-radius: 999px;
    padding: 3px 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .pp-expand-icon {
    font-size: 20px;
    color: var(--text-tertiary);
    width: 24px;
    text-align: center;
  }

  .pp-card-body {
    padding: 0 24px 24px;
    border-top: 1px solid var(--border);
  }

  .pp-card-meta {
    font-size: 13px;
    color: var(--text-tertiary);
    padding: 16px 0;
  }

  .pp-summary {
    margin-bottom: 24px;
  }
  .pp-summary-headline {
    font-family: var(--font-serif);
    font-size: 18px;
    color: var(--text-primary);
    margin: 0 0 12px;
    line-height: 1.4;
  }
  .pp-summary-detail {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 0 6px;
  }

  .pp-dimensions {
    background: var(--surface);
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 24px;
  }
  .pp-dim-row {
    margin-bottom: 16px;
  }
  .pp-dim-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-tertiary);
    margin-bottom: 6px;
  }
  .pp-dim-name {
    color: var(--text-secondary);
    font-weight: 500;
  }
  .pp-dim-track {
    height: 4px;
    background: var(--elevated);
    border-radius: 2px;
    position: relative;
  }
  .pp-dim-dot {
    position: absolute;
    top: -4px;
    width: 12px;
    height: 12px;
    background: var(--accent);
    border-radius: 50%;
    transform: translateX(-50%);
  }
  .pp-dim-categories {
    display: flex;
    gap: 32px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .pp-dim-cat-label {
    display: block;
    font-size: 11px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .pp-dim-cat-value {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .pp-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .pp-btn-primary {
    background: var(--text-primary);
    color: var(--canvas);
    border: none;
    padding: 10px 20px;
    font-size: 13px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-family: var(--font-sans);
    transition: opacity 0.15s;
  }
  .pp-btn-primary:hover { opacity: 0.85; }
  .pp-btn-accent {
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 10px 20px;
    font-size: 13px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-family: var(--font-sans);
    transition: opacity 0.15s;
  }
  .pp-btn-accent:hover { opacity: 0.85; }
  .pp-btn-secondary {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 13px;
    padding: 10px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: color 0.15s, border-color 0.15s;
    font-family: var(--font-sans);
  }
  .pp-btn-secondary:hover {
    color: var(--text-primary);
    border-color: var(--border-strong);
  }

  .pp-share-bar {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .pp-share-input {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: var(--text-primary);
    font-family: var(--font-sans);
    outline: none;
    min-width: 0;
  }
  .pp-share-input:focus {
    border-color: var(--border-strong);
  }

  @media (max-width: 600px) {
    .pp-container {
      padding: 24px 20px 60px;
    }
    .pp-heading {
      font-size: 28px;
    }
    .pp-actions {
      flex-direction: column;
      align-items: stretch;
    }
    .pp-actions > * {
      text-align: center;
    }
  }
`;
