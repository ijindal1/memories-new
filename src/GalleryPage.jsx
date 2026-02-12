import { Link } from "react-router-dom";
import { useSession, useUser } from "@descope/react-sdk";

const colors = {
  canvas: "#0C0B0E",
  surface: "#16151A",
  elevated: "#1E1D24",
  primary: "#F0EDE8",
  secondary: "#9B97A8",
  accent: "#C4704B",
};

const APPS = [
  {
    slug: "fig",
    name: "Fig",
    tagline: "Discover how you learn — get a prompt that reshapes AI for you.",
    image: "/images/fig.jpg",
    live: true,
  },
  {
    slug: "reed",
    name: "Reed",
    tagline: "Turn any article into a conversation tuned to your curiosity.",
    image: "/images/reed.jpg",
    live: false,
  },
  {
    slug: "tandem",
    name: "Tandem",
    tagline: "Practice hard conversations before they happen.",
    image: "/images/tandem.jpg",
    live: false,
  },
  {
    slug: "compass",
    name: "Compass",
    tagline: "Map your values and find what you're optimizing for.",
    image: "/images/compass.jpg",
    live: false,
  },
];

function AuthPill() {
  const { isAuthenticated } = useSession();
  const { user } = useUser();
  if (!isAuthenticated) return null;
  return (
    <div
      style={{
        fontSize: 12,
        color: "#8BC49E",
        background: "rgba(91,138,110,0.15)",
        border: "1px solid rgba(91,138,110,0.25)",
        borderRadius: 999,
        padding: "6px 12px",
        maxWidth: 240,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        fontFamily: "'DM Sans', -apple-system, sans-serif",
      }}
      title={user?.email ? `Signed in as ${user.email}` : "Signed in"}
    >
      {user?.email ? user.email : "Signed in"}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <>
      <style>{`
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .gallery-grid { grid-template-columns: 1fr; }
        }
        .gallery-card {
          background: ${colors.surface};
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .gallery-card.live {
          cursor: pointer;
        }
        .gallery-card.live:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .gallery-card .card-image {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: cover;
          display: block;
        }
        .gallery-card.coming-soon .card-image {
          opacity: 0.45;
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: colors.canvas }}>
        {/* Header */}
        <nav
          style={{
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1080,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 22,
              color: colors.primary,
            }}
          >
            memories<span style={{ color: colors.accent }}>.new</span>
          </div>
          <AuthPill />
        </nav>

        {/* Hero */}
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: "60px 32px 48px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 40,
              lineHeight: 1.15,
              color: colors.primary,
              margin: "0 0 14px",
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          >
            Know yourself.
            <br />
            Save what you find.
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', -apple-system, sans-serif",
              fontSize: 16,
              lineHeight: 1.6,
              color: colors.secondary,
              margin: 0,
            }}
          >
            Small apps that help you understand how you think, learn, and decide
            — so AI can finally talk to&nbsp;you, not at&nbsp;you.
          </p>
        </div>

        {/* Card grid */}
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "0 32px 80px",
          }}
        >
          <div className="gallery-grid">
            {APPS.map((app) => {
              const CardWrapper = app.live ? Link : "div";
              const wrapperProps = app.live
                ? { to: `/${app.slug}`, style: { textDecoration: "none", color: "inherit", display: "block" } }
                : {};
              return (
              <CardWrapper
                key={app.slug}
                className={`gallery-card ${app.live ? "live" : "coming-soon"}`}
                {...wrapperProps}
              >
                <img
                  src={app.image}
                  alt={app.name}
                  className="card-image"
                  loading="lazy"
                />
                <div style={{ padding: "16px 18px 20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: "'Instrument Serif', Georgia, serif",
                        fontSize: 22,
                        color: colors.primary,
                        margin: 0,
                        fontWeight: 400,
                      }}
                    >
                      {app.name}
                    </h2>
                    {!app.live && (
                      <span
                        style={{
                          fontFamily: "'DM Sans', -apple-system, sans-serif",
                          fontSize: 11,
                          color: colors.secondary,
                          background: colors.elevated,
                          borderRadius: 999,
                          padding: "3px 10px",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          fontWeight: 500,
                        }}
                      >
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontFamily: "'DM Sans', -apple-system, sans-serif",
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: colors.secondary,
                      margin: "0 0 14px",
                    }}
                  >
                    {app.tagline}
                  </p>
                  {app.live && (
                    <span
                      style={{
                        fontFamily: "'DM Sans', -apple-system, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: colors.accent,
                      }}
                    >
                      Try it {"\u2192"}
                    </span>
                  )}
                </div>
              </CardWrapper>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
