import { Link } from "react-router-dom";
import { useSession, useUser } from "@descope/react-sdk";

const APPS = [
  {
    slug: "fig",
    name: "fig",
    tagline: "Discover how your brain wants information.",
    image: "/images/fig.jpg",
    live: true,
  },
  {
    slug: "reed",
    name: "reed",
    tagline: "Find your voice so AI can use it.",
    image: "/images/reed.jpg",
    live: false,
  },
  {
    slug: "tandem",
    name: "tandem",
    tagline: "A user manual for your partnership.",
    image: "/images/tandem.jpg",
    live: false,
  },
  {
    slug: "compass",
    name: "compass",
    tagline: "Understand how you actually decide.",
    image: "/images/compass.jpg",
    live: false,
  },
];

function ProfileLink() {
  const { isAuthenticated } = useSession();
  if (!isAuthenticated) return null;
  return (
    <Link to="/profile" style={{ color: "inherit", textDecoration: "none" }}>Profile</Link>
  );
}

function UserEmail() {
  const { isAuthenticated } = useSession();
  const { user } = useUser();
  if (!isAuthenticated) return null;
  return (
    <span className="gp-user-email">
      {user?.email || "Signed in"}
    </span>
  );
}

export default function GalleryPage() {
  return (
    <>
      <style>{`
        .gp-root {
          --canvas: #0C0B0E;
          --surface: #16151A;
          --border: rgba(240, 237, 232, 0.12);
          --border-strong: rgba(240, 237, 232, 0.2);
          --text-primary: #F0EDE8;
          --text-secondary: #9B97A8;
          --text-tertiary: #5C5869;
          --fig-accent: #D94F7A;
          --font-serif: 'Instrument Serif', Georgia, serif;
          --font-sans: 'DM Sans', -apple-system, sans-serif;
          --page-max-width: 1200px;
          --page-padding: 40px;
          --card-radius: 10px;

          min-height: 100vh;
          background: var(--canvas);
          color: var(--text-primary);
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }

        /* NAV */
        .gp-nav {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          max-width: var(--page-max-width);
          margin: 0 auto;
          padding: 20px var(--page-padding);
        }
        .gp-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
          font-size: 14px;
          font-family: var(--font-sans);
          color: var(--text-secondary);
        }
        .gp-nav-links span {
          cursor: pointer;
          transition: color 0.2s;
        }
        .gp-nav-links span:hover {
          color: var(--text-primary);
        }
        .gp-user-email {
          font-size: 14px;
          color: var(--text-secondary);
          font-family: var(--font-sans);
        }

        /* HERO */
        .gp-hero {
          text-align: center;
          padding: 80px var(--page-padding) 72px;
          max-width: var(--page-max-width);
          margin: 0 auto;
        }
        .gp-wordmark {
          font-family: var(--font-serif);
          font-size: 64px;
          font-weight: 400;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin: 0 0 16px;
        }
        .gp-tagline {
          font-family: var(--font-sans);
          font-size: 18px;
          font-weight: 300;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        /* DIVIDER */
        .gp-divider {
          max-width: var(--page-max-width);
          margin: 0 auto;
          padding: 0 var(--page-padding);
        }
        .gp-divider hr {
          border: none;
          border-top: 1px solid var(--border-strong);
        }

        /* CARD GRID */
        .gp-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          max-width: var(--page-max-width);
          margin: 0 auto;
          padding: 0 var(--page-padding) 80px;
        }

        /* CARD */
        .gp-card {
          display: flex;
          flex-direction: column;
          padding: 24px;
          position: relative;
        }
        .gp-card:not(:nth-child(4n)) {
          border-right: 1px solid var(--border);
        }

        .gp-card-image {
          width: 100%;
          height: 180px;
          border-radius: var(--card-radius);
          overflow: hidden;
          margin-bottom: 20px;
          background: var(--surface);
          position: relative;
        }
        .gp-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Active card hover on image */
        .gp-card.active {
          cursor: pointer;
        }
        .gp-card.active .gp-card-image {
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .gp-card.active:hover .gp-card-image {
          box-shadow: 0 8px 40px rgba(217, 79, 122, 0.12);
          transform: translateY(-2px);
        }

        /* Coming soon overlay */
        .gp-card.coming-soon .gp-card-image::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(12, 11, 14, 0.5);
          pointer-events: none;
        }
        .gp-card.coming-soon .gp-card-image img {
          filter: saturate(0.25) brightness(0.75);
        }

        .gp-card-name {
          font-family: var(--font-serif);
          font-size: 26px;
          font-weight: 400;
          color: var(--text-primary);
          margin: 0 0 6px;
          line-height: 1.2;
        }
        .gp-card.coming-soon .gp-card-name {
          color: var(--text-secondary);
        }

        .gp-card-desc {
          font-family: var(--font-sans);
          font-size: 15px;
          font-weight: 400;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 20px;
          flex-grow: 1;
        }
        .gp-card.coming-soon .gp-card-desc {
          color: var(--text-tertiary);
        }

        .gp-card-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 400;
          color: var(--text-primary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .gp-card-cta:hover {
          color: var(--fig-accent);
        }
        .gp-card-cta .arrow {
          font-size: 18px;
          transition: transform 0.2s;
        }
        .gp-card-cta:hover .arrow {
          transform: translate(2px, -2px);
        }

        .gp-coming-soon-label {
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 400;
          color: var(--text-tertiary);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* INFO SECTIONS */
        .gp-info {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 var(--page-padding);
        }
        .gp-info-card {
          border: 1px solid var(--border-strong);
          border-radius: 12px;
          padding: 40px 48px;
          margin-bottom: 32px;
        }
        .gp-info-card h3 {
          font-family: var(--font-serif);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          margin: 0 0 32px;
          font-weight: 400;
        }
        .gp-step {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }
        .gp-step-num {
          font-family: var(--font-serif);
          font-size: 24px;
          color: var(--text-tertiary);
          font-weight: 400;
          min-width: 36px;
          line-height: 1.3;
        }
        .gp-step-title {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 16px;
          margin-bottom: 4px;
          font-family: var(--font-sans);
        }
        .gp-step-desc {
          color: var(--text-secondary);
          font-size: 15px;
          line-height: 1.5;
          font-family: var(--font-sans);
        }

        .gp-diff-card {
          border: 1px solid var(--border-strong);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 80px;
        }
        .gp-diff-header {
          padding: 24px 48px 12px;
        }
        .gp-diff-header h3 {
          font-family: var(--font-serif);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
          margin: 0;
          font-weight: 400;
        }
        .gp-diff-header p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 6px 0 0;
          font-family: var(--font-sans);
        }
        .gp-diff-body {
          display: flex;
          border-top: 1px solid var(--border-strong);
        }
        .gp-diff-col {
          flex: 1;
          padding: 24px 32px;
        }
        .gp-diff-col-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
          font-weight: 600;
          font-family: var(--font-sans);
        }
        .gp-diff-col-text {
          font-size: 14px;
          line-height: 1.6;
          font-family: var(--font-sans);
        }
        .gp-diff-without {
          border-right: 1px solid var(--border-strong);
        }
        .gp-diff-without .gp-diff-col-label {
          color: var(--text-tertiary);
        }
        .gp-diff-without .gp-diff-col-text {
          color: var(--text-secondary);
        }
        .gp-diff-with {
          background: rgba(91, 138, 110, 0.08);
        }
        .gp-diff-with .gp-diff-col-label {
          color: #8BC49E;
        }
        .gp-diff-with .gp-diff-col-text {
          color: var(--text-primary);
        }

        @media (max-width: 600px) {
          .gp-info-card {
            padding: 28px 24px;
          }
          .gp-diff-header {
            padding: 20px 24px 12px;
          }
          .gp-diff-body {
            flex-direction: column;
          }
          .gp-diff-without {
            border-right: none;
            border-bottom: 1px solid var(--border-strong);
          }
        }

        /* FOOTER */
        .gp-footer {
          max-width: var(--page-max-width);
          margin: 0 auto;
          padding: 0 var(--page-padding) 48px;
        }
        .gp-footer hr {
          border: none;
          border-top: 1px solid var(--border-strong);
          margin-bottom: 48px;
        }
        .gp-footer-inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 40px;
        }
        .gp-footer-brand {
          max-width: 320px;
        }
        .gp-footer-logo {
          font-family: var(--font-serif);
          font-size: 24px;
          font-weight: 400;
          color: var(--text-primary);
          margin-bottom: 10px;
        }
        .gp-footer-brand p {
          font-family: var(--font-sans);
          font-size: 14px;
          color: var(--text-tertiary);
          line-height: 1.5;
          margin: 0;
        }
        .gp-footer-links {
          display: flex;
          gap: 48px;
        }
        .gp-footer-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .gp-footer-col a,
        .gp-footer-col span {
          font-family: var(--font-sans);
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
          cursor: pointer;
        }
        .gp-footer-col a:hover,
        .gp-footer-col span:hover {
          color: var(--text-primary);
        }
        .gp-footer-bottom {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .gp-footer-copy {
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--text-tertiary);
        }
        .gp-footer-social {
          display: flex;
          gap: 20px;
        }
        .gp-footer-social a {
          color: var(--text-tertiary);
          text-decoration: none;
          font-size: 14px;
          font-family: var(--font-sans);
          transition: color 0.2s;
        }
        .gp-footer-social a:hover {
          color: var(--text-primary);
        }

        @media (max-width: 600px) {
          .gp-footer-inner {
            flex-direction: column;
            gap: 32px;
          }
          .gp-footer-links {
            gap: 32px;
          }
          .gp-footer-bottom {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .gp-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .gp-card {
            border-right: none !important;
          }
          .gp-card:nth-child(odd) {
            border-right: 1px solid var(--border) !important;
          }
          .gp-card:nth-child(n+3) {
            border-top: 1px solid var(--border);
          }
          .gp-wordmark {
            font-size: 52px;
          }
          .gp-root {
            --page-padding: 32px;
          }
        }

        @media (max-width: 600px) {
          .gp-grid {
            grid-template-columns: 1fr;
          }
          .gp-card {
            border-right: none !important;
            border-top: 1px solid var(--border);
            padding: 24px 0;
          }
          .gp-card:first-child {
            border-top: none;
          }
          .gp-hero {
            padding: 60px var(--page-padding) 48px;
          }
          .gp-wordmark {
            font-size: 40px;
          }
          .gp-tagline {
            font-size: 16px;
          }
          .gp-root {
            --page-padding: 20px;
          }
        }
      `}</style>

      <div className="gp-root">
        <nav className="gp-nav">
          <div className="gp-nav-links">
            <span>About</span>
            <span>Apps</span>
            <ProfileLink />
            <UserEmail />
          </div>
        </nav>

        <section className="gp-hero">
          <h1 className="gp-wordmark">memories.new</h1>
          <p className="gp-tagline">Know yourself. Save what you find.</p>
        </section>

        <div className="gp-divider">
          <hr />
        </div>

        <section className="gp-grid">
          {APPS.map((app) => {
            if (app.live) {
              return (
                <Link
                  key={app.slug}
                  to={`/${app.slug}`}
                  className="gp-card active"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="gp-card-image">
                    <img src={app.image} alt={app.name} loading="lazy" />
                  </div>
                  <h2 className="gp-card-name">{app.name}</h2>
                  <p className="gp-card-desc">{app.tagline}</p>
                  <span className="gp-card-cta">
                    <span>Try it</span>
                    <span className="arrow">{"\u2197"}</span>
                  </span>
                </Link>
              );
            }
            return (
              <div key={app.slug} className="gp-card coming-soon">
                <div className="gp-card-image">
                  <img src={app.image} alt={app.name} loading="lazy" />
                </div>
                <h2 className="gp-card-name">{app.name}</h2>
                <p className="gp-card-desc">{app.tagline}</p>
                <div className="gp-coming-soon-label">Coming soon</div>
              </div>
            );
          })}
        </section>

        <div className="gp-info">
          <div className="gp-info-card">
            <h3>How it works</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {[
                { num: "01", title: "Take a short experience", desc: "Each app is a few minutes of real scenarios \u2014 not abstract personality questions. React to things the way you naturally would." },
                { num: "02", title: "We map what we learn", desc: "Your choices reveal dimensions of how you think, communicate, learn, and decide. Every app builds a different part of the picture." },
                { num: "03", title: "AI adapts to you", desc: "Your results become instructions that reshape how AI talks to you \u2014 across ChatGPT, Claude, and anything else you use." },
              ].map(step => (
                <div key={step.num} className="gp-step">
                  <div className="gp-step-num">{step.num}</div>
                  <div>
                    <div className="gp-step-title">{step.title}</div>
                    <div className="gp-step-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gp-diff-card">
            <div className="gp-diff-header">
              <h3>The difference it makes</h3>
              <p>Same question, two different people.</p>
            </div>
            <div className="gp-diff-body">
              <div className="gp-diff-col gp-diff-without">
                <div className="gp-diff-col-label">Generic AI</div>
                <div className="gp-diff-col-text">
                  "Compound interest is interest calculated on both the initial principal and the accumulated interest from previous periods. The formula is A = P(1 + r/n)^(nt), where P is principal, r is annual rate..."
                </div>
              </div>
              <div className="gp-diff-col gp-diff-with">
                <div className="gp-diff-col-label">AI that knows you</div>
                <div className="gp-diff-col-text">
                  "Imagine you plant a money tree. Year 1, it grows $10 in fruit. But here's the magic: Year 2, those $10 plant their own tiny seeds. Now you've got fruit growing on fruit. That's compound interest {"\u2014"} your money making money on top of money..."
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="gp-footer">
          <hr />
          <div className="gp-footer-inner">
            <div className="gp-footer-brand">
              <div className="gp-footer-logo">memories.new</div>
              <p>Small apps that help you understand how you think, learn, and decide — so AI can finally work for you.</p>
            </div>
            <div className="gp-footer-links">
              <div className="gp-footer-col">
                <span>About</span>
                <Link to="/fig" style={{ textDecoration: "none", color: "inherit" }}>Fig</Link>
                <span>Reed</span>
                <span>Tandem</span>
                <span>Compass</span>
              </div>
              <div className="gp-footer-col">
                <span>Terms</span>
                <span>Privacy</span>
                <span>Contact</span>
              </div>
            </div>
          </div>
          <div className="gp-footer-bottom">
            <div className="gp-footer-copy">{"\u00A9"} 2026 memories.new</div>
            <div className="gp-footer-social">
              <a href="https://x.com" target="_blank" rel="noopener noreferrer">X</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
