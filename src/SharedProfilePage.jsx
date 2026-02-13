import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import { getSharedProfile } from "./lib/api.js";
import { generateProfileSummary, EXPLORATION_LABELS, INTENT_LABELS } from "./lib/profile.js";

const ALL_APPS = [
  { slug: "fig", name: "fig", tagline: "How your brain wants information" },
  { slug: "reed", name: "reed", tagline: "Find your voice so AI can use it" },
  { slug: "tandem", name: "tandem", tagline: "A user manual for your partnership" },
  { slug: "compass", name: "compass", tagline: "Understand how you actually decide" },
];

export default function SharedProfilePage() {
  const { token } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSharedProfile(token)
      .then((data) => {
        setProfile(data.profile);
        setLoading(false);
      })
      .catch(() => {
        setError("This link is invalid or expired");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="pp-root">
        <style>{sharedStyles}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p className="pp-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="pp-root">
        <style>{sharedStyles}</style>
        <nav className="pp-nav">
          <Link to="/" className="pp-wordmark">memories.new</Link>
        </nav>
        <div style={{ maxWidth: 400, margin: "120px auto", textAlign: "center", padding: "0 24px" }}>
          <h1 className="pp-heading" style={{ fontSize: 24, marginBottom: 12 }}>
            {error || "Profile not found"}
          </h1>
          <p className="pp-secondary" style={{ marginBottom: 32 }}>
            This share link may have been corrupted or the profile data is no longer available.
          </p>
          <Link to="/fig" className="pp-btn-cta">
            Discover your own learning style {"\u2192"}
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.name || "Someone";

  const completedMap = {};
  if (profile.apps) {
    for (const app of profile.apps) {
      completedMap[app.app_slug] = app;
    }
  }

  const completedApps = ALL_APPS.filter((app) => completedMap[app.slug]);

  return (
    <div className="pp-root">
      <style>{sharedStyles}</style>

      <nav className="pp-nav">
        <Link to="/" className="pp-wordmark">memories.new</Link>
      </nav>

      <div className="pp-container">
        <p className="pp-secondary" style={{ marginBottom: 8, fontSize: 14 }}>
          Shared learning profile
        </p>
        <h1 className="pp-heading">{displayName}'s Discoveries</h1>
        <p className="pp-secondary" style={{ marginBottom: 40 }}>
          See how {displayName.toLowerCase() === "someone" ? "they" : displayName} learns across memories.new
        </p>

        <div className="pp-cards">
          {completedApps.map((app) => {
            const completed = completedMap[app.slug];
            const result = completed.latest_result;
            const dimensions =
              typeof result.dimensions === "string"
                ? JSON.parse(result.dimensions)
                : result.dimensions;
            const summary = generateProfileSummary(dimensions);
            const takenDate = new Date(result.created_at).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            );

            return (
              <div key={app.slug} className="pp-card pp-card-completed">
                <div className="pp-card-header">
                  <div>
                    <h2 className="pp-card-name">{app.name}</h2>
                    <p className="pp-card-tagline">{app.tagline}</p>
                  </div>
                  <span className="pp-badge-done">Completed</span>
                </div>

                <div className="pp-card-body">
                  <div className="pp-card-meta">Taken {takenDate}</div>

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
                    ].map((dim) => (
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
                        <span className="pp-dim-cat-value">
                          {EXPLORATION_LABELS[dimensions.exploration]}
                        </span>
                      </div>
                      <div>
                        <span className="pp-dim-cat-label">Intent</span>
                        <span className="pp-dim-cat-value">
                          {INTENT_LABELS[dimensions.intent]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pp-shared-cta">
          <p className="pp-secondary" style={{ marginBottom: 16 }}>
            Want to see how you learn?
          </p>
          <Link to="/fig" className="pp-btn-cta">
            Discover your own learning style {"\u2192"}
          </Link>
        </div>
      </div>
    </div>
  );
}

const sharedStyles = `
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

  .pp-card-name {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 400;
    color: var(--text-primary);
    margin: 0 0 2px;
  }
  .pp-card-tagline {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
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

  .pp-shared-cta {
    text-align: center;
    margin-top: 48px;
    padding-top: 32px;
    border-top: 1px solid var(--border);
  }
  .pp-btn-cta {
    display: inline-block;
    background: var(--text-primary);
    color: var(--canvas);
    border: none;
    padding: 12px 28px;
    font-size: 14px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-family: var(--font-sans);
    text-decoration: none;
    transition: opacity 0.15s;
  }
  .pp-btn-cta:hover { opacity: 0.85; }

  @media (max-width: 600px) {
    .pp-container {
      padding: 24px 20px 60px;
    }
    .pp-heading {
      font-size: 28px;
    }
  }
`;
