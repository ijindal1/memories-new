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
      </div>
    </>
  );
}
