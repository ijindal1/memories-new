import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <>
      <style>{`
        .about-root {
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

          min-height: 100vh;
          background: var(--canvas);
          color: var(--text-primary);
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
        }

        .about-nav {
          padding: 20px 40px;
          max-width: 960px;
          margin: 0 auto;
        }
        .about-wordmark {
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 400;
          color: var(--text-primary);
          text-decoration: none;
        }
        .about-wordmark span {
          color: var(--fig-accent);
        }

        .about-header {
          text-align: center;
          padding: 80px 32px 0;
          max-width: 640px;
          margin: 0 auto;
        }
        .about-title {
          font-family: var(--font-serif);
          font-size: 48px;
          font-weight: 400;
          color: var(--text-primary);
          margin: 0 0 32px;
          line-height: 1.15;
          letter-spacing: -0.01em;
        }
        .about-header hr {
          border: none;
          border-top: 1px solid var(--border-strong);
          margin: 0;
        }

        .about-body {
          max-width: 640px;
          margin: 0 auto;
          padding: 40px 32px 80px;
        }
        .about-body p {
          font-family: var(--font-sans);
          font-size: 17px;
          line-height: 1.75;
          color: var(--text-secondary);
          margin: 0 0 24px;
        }
        .about-body p em {
          font-style: italic;
          color: var(--text-primary);
        }
        .about-body hr {
          border: none;
          border-top: 1px solid var(--border-strong);
          margin: 40px 0;
        }
        .about-body a {
          color: var(--text-primary);
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: var(--text-tertiary);
          transition: text-decoration-color 0.2s;
        }
        .about-body a:hover {
          text-decoration-color: var(--text-primary);
        }

        .about-signoff {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid var(--border);
          font-family: var(--font-sans);
          font-size: 15px;
          color: var(--text-secondary);
        }
        .about-signoff-name {
          font-family: var(--font-serif);
          font-size: 20px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .about-signoff-links {
          display: flex;
          gap: 20px;
          margin-top: 12px;
        }
        .about-signoff-links a {
          font-size: 14px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .about-signoff-links a:hover {
          color: var(--text-primary);
        }

        @media (max-width: 600px) {
          .about-nav {
            padding: 20px 20px;
          }
          .about-header {
            padding: 60px 20px 0;
          }
          .about-title {
            font-size: 36px;
          }
          .about-body {
            padding: 32px 20px 60px;
          }
          .about-body p {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="about-root">
        <nav className="about-nav">
          <Link to="/" className="about-wordmark">
            memories<span>.new</span>
          </Link>
        </nav>

        <header className="about-header">
          <h1 className="about-title">Before You Ask</h1>
          <hr />
        </header>

        <article className="about-body">
          <p>
            AI is trained on the collected writing of millions of people. It knows how to talk to a generic person remarkably well.
          </p>
          <p>
            But you're not generic.
          </p>
          <p>
            You have a specific way you like to receive information {"\u2014"} how much detail, how much context, how direct, how patient. Those preferences are real. They affect whether you actually absorb what you're reading or just skim past it.
          </p>
          <p>
            The strange thing is, most people have never articulated these preferences to themselves, let alone to a machine.
          </p>
          <p>
            That's what <a href="https://memories.new" target="_blank" rel="noopener noreferrer">memories.new</a> is for.
          </p>
          <p>
            I build small, interactive tools that help you discover things about yourself {"\u2014"} how you learn, how you write, how you make decisions {"\u2014"} and turn those discoveries into something usable. A prompt you can hand to any AI so it actually talks to <em>you</em>, not to everyone.
          </p>
          <p>
            The quizzes aren't personality tests in the horoscope sense. They measure real preferences through scenarios, not self-descriptions. You don't tell us who you are. You show us, through the choices you make.
          </p>

          <hr />

          <p>
            Different people need to be spoken to differently. Explained to differently. Encouraged differently.
          </p>
          <p>
            A good teacher already knows this. She watches a student's face and adjusts {"\u2014"} slows down, tries a different angle, adds an example. A good manager knows it. A good friend knows it.
          </p>
          <p>
            AI can do this too. It just doesn't know who's sitting on the other side.
          </p>
          <p>
            I'm Ishita. I'm the co-founder of <a href="https://memory.store" target="_blank" rel="noopener noreferrer">Memory Store</a>, where we give AI the ability to remember. memories.new is a passion project that comes from the same place {"\u2014"} that everyone deserves to be understood the way they need to be, and that a little self-knowledge goes a long way.
          </p>
          <p>
            What you discover here, you can save to Memory Store {"\u2014"} so the next conversation already knows how to talk to you.
          </p>
          <p>
            Know yourself. Save what you find.
          </p>

          <div className="about-signoff">
            <div className="about-signoff-name">Ishita Jindal</div>
            <div className="about-signoff-links">
              <a href="https://linkedin.com/in/ishitajindal" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://x.com/IshitaJindal17" target="_blank" rel="noopener noreferrer">X</a>
              <a href="https://memory.store" target="_blank" rel="noopener noreferrer">Memory Store</a>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
