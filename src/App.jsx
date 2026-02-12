import { useState, useEffect } from "react";
import { useSession, useUser, Descope } from "@descope/react-sdk";

import posthog from "posthog-js";
import { saveResult, getResultByApp } from "./lib/api.js";

// ============================================================
// RESPONSIVE HOOK
// ============================================================

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

// ============================================================
// DATA: Quiz scenarios, scoring, and prompt generation (v2)
// ============================================================

const SCENARIOS = [
  {
    id: 1,
    title: "The Explanation Style",
    measures: ["density", "exploration"],
    question: "You want to understand how credit scores work.",
    options: [
      {
        id: "a",
        text: "\"Your credit score is a number between 300\u2013850 that lenders use to decide if they'll lend you money. The higher, the better. Five things affect it: payment history (35%), how much you owe (30%), how long you've had credit (15%), new credit (10%), and types of credit (10%). The single most important thing you can do is pay on time.\"",
        scores: { density: 5, exploration: "problem-solver" }
      },
      {
        id: "b",
        text: "\"Think of your credit score like a reputation score in a small town. Every time you borrow something and return it on time, people trust you more. But if you borrow from too many people at once, or max out what you owe, people start to wonder. Banks work the same way \u2014 they just use math instead of gossip. Let me walk you through how the math works...\"",
        scores: { density: 2, exploration: "connector" }
      },
      {
        id: "c",
        text: "\"Before we get into credit scores specifically, let's understand the bigger picture: why does lending even work as a system? When a bank gives you money, they're taking a risk. The entire credit system exists to quantify that risk. Your credit score is one piece of that system. Here's how it fits together...\"",
        scores: { density: 2, exploration: "deep-diver" }
      },
      {
        id: "d",
        text: "\"Let's build this up step by step. First \u2014 what even is credit? It's just the ability to borrow money. Once that clicks, we'll look at how banks decide who to trust, which is where the score comes in. Each piece builds on the last, so by the end the whole thing will make sense.\"",
        scores: { density: 2, exploration: "explorer" }
      }
    ]
  },
  {
    id: 2,
    title: "The Detail Level",
    measures: ["density", "exploration", "intent"],
    question: "You ask: \"How does Wi-Fi actually work?\"",
    options: [
      {
        id: "a",
        text: "\"Your router converts internet data into radio waves, your device picks them up and converts them back. It's like a two-way radio, just very fast. That's the core of it.\"",
        scores: { density: 5, exploration: "connector", intent: "do" }
      },
      {
        id: "b",
        text: "\"Wi-Fi uses radio frequencies (usually 2.4GHz or 5GHz) to transmit data in packets between your router and device. The 802.11 protocol family governs how these packets are encoded, transmitted, and error-checked. Let me break down each layer...\"",
        scores: { density: 5, exploration: "deep-diver", intent: "understand" }
      },
      {
        id: "c",
        text: "\"Let's build this up. First: what are radio waves? Then: how do you put information into radio waves? Then: how does your device know which waves are for it? By the end you'll understand the full chain.\"",
        scores: { density: 2, exploration: "deep-diver", intent: "understand" }
      },
      {
        id: "d",
        text: "\"Here's the 2-minute version that covers what most people actually need to know, with a 'go deeper' option for each part if you're curious.\"",
        scores: { density: 3, exploration: "explorer", intent: "explore" }
      }
    ]
  },
  {
    id: 3,
    title: "The Comfort Level",
    measures: ["confidence", "tone"],
    question: "You've been putting something off for weeks and want to understand why. You ask: \"Why do people procrastinate?\"",
    options: [
      {
        id: "a",
        text: "\"Procrastination isn't about laziness \u2014 so if you've been beating yourself up, you can let that go. It's actually your brain's way of avoiding discomfort. The task feels threatening in some way \u2014 too boring, too hard, too ambiguous \u2014 and your brain picks short-term relief over long-term reward. The good news? Once you see the pattern, it's very fixable. Here's what's actually happening...\"",
        scores: { confidence: 2, tone: 2 }
      },
      {
        id: "b",
        text: "\"Procrastination is a failure of emotion regulation, not time management. The brain's limbic system (which seeks immediate comfort) overrides the prefrontal cortex (which plans for the future). The key factors are: task aversiveness, low self-efficacy, impulsiveness, and distant deadlines. Here's the research behind each...\"",
        scores: { confidence: 5, tone: 5 }
      },
      {
        id: "c",
        text: "\"Short answer: your brain is protecting you from discomfort. Long answer involves the interplay between your emotional brain and your planning brain. Which level do you want?\"",
        scores: { confidence: 5, tone: 3 }
      },
      {
        id: "d",
        text: "\"Everyone procrastinates \u2014 it's one of the most universal human behaviors, and understanding why is genuinely interesting. Your brain is basically running a cost-benefit analysis in real time, and sometimes it gets the math wrong. Let me show you what's happening under the hood, step by step...\"",
        scores: { confidence: 3, tone: 2 }
      }
    ]
  },
  {
    id: 4,
    title: "The Approach",
    measures: ["confidence", "exploration"],
    question: "You're thinking about buying a home and need to understand how mortgages work.",
    options: [
      {
        id: "a",
        text: "\"Let's start with the simplest version: a mortgage is a loan to buy a house. You pay it back monthly over 15\u201330 years. That's it at the core. Now, there are about 5 important details that affect how much you'll actually pay. Want to go through them one at a time?\"",
        scores: { confidence: 3, exploration: "explorer" }
      },
      {
        id: "b",
        text: "\"Here's everything you need to know about mortgages, organized from most to least important: [structured overview with sections]. Bookmark this \u2014 it covers the full picture.\"",
        scores: { confidence: 5, exploration: "problem-solver" }
      },
      {
        id: "c",
        text: "\"A mortgage is similar to a car loan, if you've had one \u2014 but with some key differences. The biggest difference is the timeline and what's at stake, which changes how interest works. Let me walk you through it by building on what you probably already know about borrowing...\"",
        scores: { confidence: 3, exploration: "connector" }
      },
      {
        id: "d",
        text: "\"Buying a home is a big deal, and it's smart that you're learning about this. Let me walk you through mortgages in plain English \u2014 no jargon, and I'll flag the parts where most first-time buyers get tripped up.\"",
        scores: { confidence: 2, exploration: "explorer", tone: 2 }
      }
    ]
  },
  {
    id: 5,
    title: "The Tone Test",
    measures: ["tone", "density", "confidence"],
    question: "You ask an AI to explain what inflation is. Both responses say the same thing differently. Which do you prefer?",
    options: [
      {
        id: "a",
        text: "\"So imagine you go to your favorite coffee shop every morning. Last year your latte was $4, now it's $4.50. That's inflation in action \u2014 your dollar buys less than it used to. But here's the interesting part: a little inflation is actually considered healthy for the economy. Weird, right? Let me explain why...\"",
        scores: { tone: 2, density: 2, confidence: 2 }
      },
      {
        id: "b",
        text: "\"Inflation is the rate at which the general price level of goods and services rises over time, reducing purchasing power. It is measured primarily through the Consumer Price Index (CPI). Central banks typically target ~2% annual inflation, as moderate inflation encourages spending and investment over hoarding cash.\"",
        scores: { tone: 5, density: 5, confidence: 5 }
      }
    ]
  },
  {
    id: 6,
    title: "The Follow-Up",
    measures: ["engagement", "intent"],
    question: "You just read an explanation of how habits form. Here's what the AI says next:",
    options: [
      {
        id: "a",
        text: "\"Quick check \u2014 think of a habit you've tried to build recently. Can you identify which of the three stages (cue, routine, reward) was weakest? That's almost always where it broke down.\"",
        scores: { engagement: 5, intent: "understand" }
      },
      {
        id: "b",
        text: "\"Now here's where it gets interesting \u2014 addiction uses this exact same loop, but with a twist. The reward signal gets hijacked. Want to see how the same mechanism explains both good habits and destructive ones?\"",
        scores: { engagement: 3, intent: "explore" }
      },
      {
        id: "c",
        text: "\"Here's a practical takeaway you can use today: pick one habit you want to build and design a specific cue for it. Don't worry about motivation \u2014 the cue is what actually drives the behavior. Here's how to pick a good one...\"",
        scores: { engagement: 1, intent: "do" }
      },
      {
        id: "d",
        text: "\"Here's a clean summary of the habit loop: 1) Cue triggers the behavior, 2) Routine is the behavior itself, 3) Reward reinforces it. The key insight is that you change habits by keeping the cue and reward but swapping the routine.\"",
        scores: { engagement: 1, intent: "understand" }
      }
    ]
  },
  {
    id: 7,
    title: "The Challenge",
    measures: ["engagement"],
    question: "You're learning about nutrition. After explaining the basics of protein, carbs, and fats, here's what the AI says next:",
    options: [
      {
        id: "a",
        text: "\"Here's a mini-challenge: think about what you ate yesterday. Without looking anything up, try to guess \u2014 was it roughly balanced across the three macros, or heavily skewed toward one? I'll help you break it down.\"",
        scores: { engagement: 5 }
      },
      {
        id: "b",
        text: "\"Here's the simplest practical framework: fill half your plate with vegetables, a quarter with protein, a quarter with carbs. Works for most meals without any counting or tracking.\"",
        scores: { engagement: 1 }
      },
      {
        id: "c",
        text: "\"Let me test your understanding: if someone says they're eating 'low carb, high protein' but they're always tired \u2014 what might be going on? Think about it for a moment before I explain.\"",
        scores: { engagement: 5 }
      },
      {
        id: "d",
        text: "\"Here are the key points to remember: protein builds and repairs, carbs are your main energy source, fats support hormones and absorption. The ratio matters less than most people think \u2014 consistency and whole foods matter more.\"",
        scores: { engagement: 1 }
      }
    ]
  },
  {
    id: 8,
    title: "The Instinct Check",
    measures: ["exploration", "intent"],
    question: "You just learned the basics of how climate change works. What's your instinct for what should come next?",
    options: [
      {
        id: "a",
        text: "\"What can I personally do about it? Give me the highest-impact actions for an individual.\"",
        scores: { exploration: "problem-solver", intent: "do" }
      },
      {
        id: "b",
        text: "\"How does this connect to the other environmental issues I keep hearing about \u2014 like biodiversity loss and ocean acidification? I want to see how they're all related.\"",
        scores: { exploration: "connector", intent: "explore" }
      },
      {
        id: "c",
        text: "\"I want to understand the science more deeply. How exactly do greenhouse gases trap heat? What's happening at a molecular level?\"",
        scores: { exploration: "deep-diver", intent: "understand" }
      },
      {
        id: "d",
        text: "\"What are the different perspectives on solutions? I want to understand the debate \u2014 economic trade-offs, policy approaches, technological bets.\"",
        scores: { exploration: "explorer", intent: "explore" }
      }
    ]
  },
  {
    id: 9,
    title: "The Feedback Style",
    measures: ["candor"],
    question: "You share an idea with an AI and ask for feedback. Which response would you rather get?",
    options: [
      {
        id: "a",
        text: "\"That's an interesting concept! There are some real strengths here \u2014 particularly the timing and the target audience. A few things worth considering as you develop it: the market might be more competitive than expected, and you'll want to think through your distribution strategy. Overall, it has potential with some refinement.\"",
        scores: { candor: 1 }
      },
      {
        id: "b",
        text: "\"Here's what's strong and here's what's weak. Strengths: [X, Y]. Weaknesses: [Z, W]. The biggest risk I see is [specific]. I'd recommend focusing on [specific next step] to de-risk it.\"",
        scores: { candor: 4 }
      },
      {
        id: "c",
        text: "\"Let me give you both sides. Here's the strongest case FOR this idea: [...]. Here's the strongest case AGAINST: [...]. The biggest unknown is [...].\"",
        scores: { candor: 3 }
      },
      {
        id: "d",
        text: "\"Honest take: I don't see a defensible advantage yet. The space is crowded and your differentiator isn't clear. But that doesn't mean it's dead \u2014 here's the one angle that could work if you go narrow: [specific pivot].\"",
        scores: { candor: 5 }
      }
    ]
  }
];

// ============================================================
// SCORING ENGINE (v2)
// ============================================================

function computeProfile(answers) {
  const densityScores = [];
  const confidenceScores = [];
  const toneScores = [];
  const engagementScores = [];
  const explorationVotes = [];
  const intentVotes = [];
  const candorScores = [];

  answers.forEach((answer, idx) => {
    const scenario = SCENARIOS[idx];
    const option = scenario.options.find(o => o.id === answer);
    if (!option) return;
    const s = option.scores;

    if (s.density !== undefined) densityScores.push(s.density);
    if (s.confidence !== undefined) confidenceScores.push(s.confidence);
    if (s.tone !== undefined) toneScores.push(s.tone);
    if (s.engagement !== undefined) engagementScores.push(s.engagement);
    if (s.exploration !== undefined) explorationVotes.push(s.exploration);
    if (s.intent !== undefined) intentVotes.push(s.intent);
    if (s.candor !== undefined) candorScores.push(s.candor);
  });

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 3;
  const mode = arr => {
    if (!arr.length) return "explorer";
    const counts = {};
    arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  return {
    density: Math.round(avg(densityScores)),
    confidence: Math.round(avg(confidenceScores)),
    tone: Math.round(avg(toneScores)),
    engagement: Math.round(avg(engagementScores)),
    exploration: mode(explorationVotes),
    intent: mode(intentVotes),
    candor: Math.round(avg(candorScores))
  };
}

const EXPLORATION_LABELS = {
  "explorer": "Explorer",
  "problem-solver": "Problem Solver",
  "deep-diver": "Deep Diver",
  "connector": "Connector"
};

const INTENT_LABELS = {
  "understand": "Understand Deeply",
  "do": "Get Things Done",
  "explore": "Explore Curiously"
};

const EXPLORATION_DESCRIPTIONS = {
  "explorer": "you naturally want a guided path \u2014 show me the map, then let me navigate",
  "problem-solver": "you want the answer first, then just enough context to use it",
  "deep-diver": "you want to build understanding from the foundations up",
  "connector": "you look for bridges and analogies from what you already know"
};

const INTENT_DESCRIPTIONS = {
  "understand": "understand things deeply \u2014 you want the \"why\" behind the \"what\"",
  "do": "get practical, actionable information \u2014 you want to make decisions and move",
  "explore": "follow interesting threads \u2014 you want to discover connections and possibilities"
};

function generateProfileSummary(profile) {
  const densityLabel = profile.density >= 4 ? "dense, efficient" : profile.density >= 3 ? "balanced" : "spacious, scaffolded";
  const toneLabel = profile.tone >= 4 ? "clean and direct" : profile.tone >= 3 ? "professional" : "warm and conversational";

  const confidenceDesc = profile.confidence >= 4
    ? "You're self-directed and prefer AI that respects your ability to figure things out."
    : profile.confidence >= 3
    ? "You appreciate a balance of support and substance."
    : "You appreciate encouragement when tackling unfamiliar material \u2014 not because you need hand-holding, but because a little reassurance keeps your momentum going.";

  const engagementDesc = profile.engagement >= 4
    ? "You prefer to be challenged and tested \u2014 active engagement helps you retain more."
    : profile.engagement >= 3
    ? "You like a mix of information delivery and the occasional question to keep you sharp."
    : "You prefer to absorb information at your own pace rather than being quizzed.";

  const candorDesc = profile.candor >= 4
    ? "When it comes to feedback, you want the unfiltered truth \u2014 skip the diplomacy and tell it straight."
    : profile.candor >= 3
    ? "When it comes to feedback, you prefer a balanced perspective \u2014 show me both sides and let me decide."
    : "When it comes to feedback, you prefer encouragement first, with criticism framed constructively.";

  return {
    headline: "You're a" + (profile.exploration === "explorer" ? "n" : "") + " " + EXPLORATION_LABELS[profile.exploration] + " who prefers " + densityLabel + " explanations in a " + toneLabel + " style.",
    details: [
      "When approaching new topics, " + EXPLORATION_DESCRIPTIONS[profile.exploration] + ".",
      confidenceDesc,
      engagementDesc,
      candorDesc,
      "Your primary learning intent is to " + INTENT_DESCRIPTIONS[profile.intent] + ".",
    ]
  };
}

// ============================================================
// PROMPT GENERATION (v2)
// ============================================================

function generatePrompt(profile) {
  const densityInstruction = profile.density >= 4
    ? "Be direct and dense. Lead with the bottom line, then provide supporting detail. Don't over-explain or pad with unnecessary build-up."
    : profile.density >= 3
    ? "Lead with the key point, then give me one level of supporting detail. Keep paragraphs focused on one idea each. I'll ask if I want more."
    : "Build up to ideas gradually. Use short paragraphs, space between concepts, and check in before adding complexity. Never dump all the information at once.";

  const explorationMap = {
    "explorer": "When I ask about something new, help me map the territory first. Give me the lay of the land before diving into details. Use a guided, step-by-step progression.",
    "problem-solver": "Give me the answer first, then the essential context I need to understand and use it. Be efficient \u2014 I'll ask follow-ups if I want more.",
    "deep-diver": "Start from foundations and build up. I want to understand the 'why' behind things, not just the 'what'. Don't skip steps in the reasoning.",
    "connector": "Use analogies, comparisons, and bridges to things I might already know. Frame new concepts in terms of familiar ones, then show where the analogy breaks down."
  };
  const explorationInstruction = explorationMap[profile.exploration];

  const toneInstruction = profile.tone >= 4
    ? "Be precise and neutral. Lead with information, not rapport. Skip pleasantries and get to substance."
    : profile.tone >= 3
    ? "Be clear and approachable. A natural, professional tone \u2014 like a smart colleague explaining something at a whiteboard."
    : "Be warm and conversational. Use 'you', tell brief stories or examples, and make the explanation feel like a knowledgeable friend talking to me.";

  const candorInstruction = profile.candor >= 4
    ? "Give me your unfiltered take. Push back when I'm wrong. Skip caveats and hedging. Never repeat a point you've already made. I'd rather hear an uncomfortable truth than a comfortable non-answer."
    : profile.candor >= 3
    ? "Be honest and direct, but constructive. Present both sides clearly and let me draw my own conclusions."
    : "Be encouraging and diplomatic. When pointing out issues, lead with strengths first and frame weaknesses constructively.";

  const engagementInstruction = profile.engagement >= 4
    ? "Challenge me. Ask me questions, pose scenarios, make me think before giving answers. I retain more when I'm actively tested."
    : profile.engagement >= 3
    ? "Occasionally offer optional challenges or thought experiments, but don't force them. Mark them clearly as optional."
    : "Provide clear summaries and structured takeaways. Don't quiz me or ask me to 'think about it' \u2014 I prefer to absorb and revisit.";

  const intentMap = {
    "understand": "build deep understanding. Help me grasp why things work, not just how. Prioritize clarity of explanation over speed.",
    "do": "get practical, actionable information efficiently. Prioritize what I need to know to make decisions or take action.",
    "explore": "explore and discover. Follow interesting threads, show me connections between ideas, and surprise me with angles I wouldn't have thought of."
  };
  const intentInstruction = intentMap[profile.intent];

  const confidenceInstruction = profile.confidence <= 2
    ? "\nWhen I'm tackling something unfamiliar, include brief reassurances that the material is learnable. Normalize that it takes time. Celebrate small progress points.\n"
    : "";

  return "When responding to me, please follow these preferences for how I best absorb information:\n\n**Structure:** " + densityInstruction + "\n\n**Approach:** " + explorationInstruction + "\n\n**Tone:** " + toneInstruction + "\n\n**Honesty:** " + candorInstruction + "\n\n**Engagement:** " + engagementInstruction + "\n\n**My goal is usually to:** " + intentInstruction + "\n" + confidenceInstruction + "\nApply these preferences naturally \u2014 don't mention them or call attention to the fact that you're adjusting your style. Just respond in the way described above.";
}

// ============================================================
// COMPONENTS
// ============================================================

const colors = {
  bg: "#FDFBF7",
  bgWarm: "#FAF6EF",
  text: "#2D2A26",
  textSecondary: "#6B6560",
  accent: "#C4704B",
  accentLight: "#E8C4B0",
  accentSubtle: "#F5E6DB",
  border: "#E8E2D9",
  white: "#FFFFFF",
  green: "#5B8A6E",
  greenLight: "#E8F0EB",
};

function LandingPage({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <nav style={{
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 960,
        margin: "0 auto",
      }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: colors.text, fontWeight: 600 }}>
          memories<span style={{ color: colors.accent }}>.new</span>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 14, color: colors.textSecondary }}>
          <span style={{ cursor: "pointer" }}>About</span>
          <span style={{ cursor: "pointer" }}>Apps</span>
        </div>
      </nav>

      <div style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "80px 32px 40px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block",
          padding: "6px 14px",
          background: colors.accentSubtle,
          borderRadius: 20,
          fontSize: 13,
          color: colors.accent,
          marginBottom: 24,
          fontWeight: 500,
        }}>
          {"\u2726"} Your first memory
        </div>

        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: 44,
          lineHeight: 1.15,
          color: colors.text,
          margin: "0 0 20px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}>
          AI doesn't know<br />how you think
        </h1>

        <p style={{
          fontSize: 18,
          lineHeight: 1.6,
          color: colors.textSecondary,
          margin: "0 auto 40px",
          maxWidth: 480,
        }}>
          Everyone gets the same answers. But you don't learn the same way as everyone else. Take a 4-minute quiz and get a personalized prompt that changes how AI talks to you {"\u2014"} forever.
        </p>

        <button
          onClick={onStart}
          style={{
            background: colors.text,
            color: colors.bg,
            border: "none",
            padding: "14px 36px",
            fontSize: 16,
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 500,
            letterSpacing: "0.01em",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={e => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={e => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          Discover your learning style {"\u2192"}
        </button>

        <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12, opacity: 0.7 }}>
          No signup required {"\u00b7"} Works with ChatGPT & Claude
        </p>
      </div>

      <div style={{
        maxWidth: 720,
        margin: "40px auto 0",
        padding: "0 32px 60px",
      }}>
        <div style={{
          background: colors.white,
          border: "1px solid " + colors.border,
          borderRadius: 16,
          padding: "40px 48px",
        }}>
          <h3 style={{
            fontFamily: "Georgia, serif",
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: colors.textSecondary,
            margin: "0 0 32px",
            fontWeight: 500,
          }}>
            How it works
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {[
              { num: "01", title: "9 quick scenarios", desc: "React to real AI responses \u2014 not abstract personality questions. Takes about 4 minutes." },
              { num: "02", title: "We map your profile", desc: "Your answers reveal 7 dimensions: how dense you like information, what tone works for you, whether you want to be challenged, and more." },
              { num: "03", title: "Get your custom prompt", desc: "A personalized instruction you paste into ChatGPT or Claude that permanently changes how AI responds to you." }
            ].map(step => (
              <div key={step.num} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{
                  fontFamily: "Georgia, serif",
                  fontSize: 24,
                  color: colors.accentLight,
                  fontWeight: 600,
                  minWidth: 36,
                  lineHeight: 1.3,
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: colors.text, fontSize: 16, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "0 32px 80px",
      }}>
        <div style={{
          background: colors.white,
          border: "1px solid " + colors.border,
          borderRadius: 16,
          overflow: "hidden",
        }}>
          <div style={{ padding: "24px 48px 12px" }}>
            <h3 style={{
              fontFamily: "Georgia, serif",
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: colors.textSecondary,
              margin: 0,
              fontWeight: 500,
            }}>
              The difference it makes
            </h3>
            <p style={{ fontSize: 14, color: colors.textSecondary, margin: "6px 0 0" }}>
              Same question: "How does compound interest work?"
            </p>
          </div>
          <div style={{ display: "flex", borderTop: "1px solid " + colors.border }}>
            <div style={{ flex: 1, padding: "24px 32px", borderRight: "1px solid " + colors.border }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.textSecondary, marginBottom: 12, fontWeight: 600 }}>
                Without your prompt
              </div>
              <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.6 }}>
                "Compound interest is interest calculated on both the initial principal and the accumulated interest from previous periods. The formula is A = P(1 + r/n)^(nt), where P is principal, r is annual rate..."
              </div>
            </div>
            <div style={{ flex: 1, padding: "24px 32px", background: colors.greenLight }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.green, marginBottom: 12, fontWeight: 600 }}>
                With your prompt
              </div>
              <div style={{ fontSize: 14, color: colors.text, lineHeight: 1.6 }}>
                "Imagine you plant a money tree. Year 1, it grows $10 in fruit. But here's the magic: Year 2, those $10 plant their own tiny seeds. Now you've got fruit growing on fruit. That's compound interest {"\u2014"} your money making money on top of money..."
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function QuizPage({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  const scenario = SCENARIOS[current];
  const progress = ((current) / SCENARIOS.length) * 100;

  useEffect(() => {
    setFadeIn(false);
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, [current]);

  const handleSelect = (optionId) => {
    if (transitioning) return;
    setSelected(optionId);
    setTransitioning(true);

    posthog.capture('question_answered', {
      question_number: current + 1,
      question_title: scenario.title,
      selected_option: optionId,
    });

    setTimeout(() => {
      const newAnswers = [...answers, optionId];
      setAnswers(newAnswers);
      setSelected(null);

      if (current + 1 >= SCENARIOS.length) {
        const profile = computeProfile(newAnswers);
        posthog.capture('quiz_completed', {
          density: profile.density,
          exploration: profile.exploration,
          confidence: profile.confidence,
          tone: profile.tone,
          engagement: profile.engagement,
          intent: profile.intent,
          candor: profile.candor,
        });
        onComplete(newAnswers);
      } else {
        setCurrent(current + 1);
        setTransitioning(false);
      }
    }, 400);
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <div style={{
        padding: "20px 32px",
        maxWidth: 960,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: colors.text, fontWeight: 600 }}>
          memories<span style={{ color: colors.accent }}>.new</span>
        </div>
        <div style={{ fontSize: 14, color: colors.textSecondary }}>
          {current + 1} of {SCENARIOS.length}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ height: 3, background: colors.border, borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            background: colors.accent,
            borderRadius: 2,
            width: progress + "%",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      <div style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "48px 32px",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}>
        <h2 style={{
          fontFamily: "Georgia, serif",
          fontSize: 22,
          lineHeight: 1.4,
          color: colors.text,
          margin: "0 0 32px",
          fontWeight: 500,
        }}>
          {scenario.question}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {scenario.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "18px 22px",
                background: selected === option.id ? colors.accentSubtle : colors.white,
                border: "1.5px solid " + (selected === option.id ? colors.accent : colors.border),
                borderRadius: 12,
                cursor: transitioning ? "default" : "pointer",
                fontSize: 15,
                lineHeight: 1.55,
                color: colors.text,
                transition: "all 0.2s ease",
                opacity: selected && selected !== option.id ? 0.5 : 1,
                fontFamily: "inherit",
              }}
              onMouseEnter={e => {
                if (!transitioning && !selected) {
                  e.target.style.borderColor = colors.accentLight;
                  e.target.style.background = colors.bgWarm;
                }
              }}
              onMouseLeave={e => {
                if (!selected || selected !== option.id) {
                  e.target.style.borderColor = colors.border;
                  e.target.style.background = colors.white;
                }
              }}
            >
              <span style={{
                display: "inline-block",
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "1.5px solid " + (selected === option.id ? colors.accent : colors.border),
                textAlign: "center",
                lineHeight: "22px",
                fontSize: 12,
                fontWeight: 600,
                marginRight: 14,
                color: selected === option.id ? colors.accent : colors.textSecondary,
                background: selected === option.id ? colors.white : "transparent",
                verticalAlign: "top",
                flexShrink: 0,
              }}>
                {option.id.toUpperCase()}
              </span>
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


function ResultsPage({ answers, onRestart }) {
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user } = useUser();
  const profile = computeProfile(answers);
  const summary = generateProfileSummary(profile);
  const prompt = generatePrompt(profile);

  const doSave = async () => {
    setSaveState("saving");
    try {
      await saveResult({
        app_slug: "learn",
        dimensions: profile,
        generated_prompt: prompt,
        answers,
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  // Auto-save when user just logged in via the inline Descope flow
  useEffect(() => {
    if (isAuthenticated && saveState === "pending-login") {
      doSave();
    }
  }, [isAuthenticated]);

  // Listen for magic link completion from other tab
  useEffect(() => {
    if (isAuthenticated || saveState === "idle") return;
    const channel = new BroadcastChannel("memories-auth");
    channel.onmessage = () => {
      // Magic link verified in another tab — force a page reload to pick up the session
      window.location.reload();
    };
    return () => channel.close();
  }, [isAuthenticated, saveState]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      posthog.capture('prompt_copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      posthog.capture('prompt_copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <nav style={{
        padding: "20px 32px",
        maxWidth: 960,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: colors.text, fontWeight: 600 }}>
          memories<span style={{ color: colors.accent }}>.new</span>
        </div>
        <button
          onClick={onRestart}
          style={{
            background: "none",
            border: "1px solid " + colors.border,
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 13,
            color: colors.textSecondary,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Retake quiz
        </button>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 32px 0" }}>
        <div style={{
          display: "inline-block",
          padding: "6px 14px",
          background: colors.greenLight,
          borderRadius: 20,
          fontSize: 13,
          color: colors.green,
          marginBottom: 24,
          fontWeight: 500,
        }}>
          {"\u2713"} Your learning profile
        </div>

        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: 32,
          lineHeight: 1.25,
          color: colors.text,
          margin: "0 0 24px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}>
          {summary.headline}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
          {summary.details.map((detail, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.6, color: colors.textSecondary, margin: 0 }}>
              {detail}
            </p>
          ))}
        </div>

        <div style={{
          background: colors.white,
          border: "1px solid " + colors.border,
          borderRadius: 16,
          padding: "32px",
          marginBottom: 32,
        }}>
          <h3 style={{
            fontFamily: "Georgia, serif",
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: colors.textSecondary,
            margin: "0 0 24px",
            fontWeight: 500,
          }}>
            Your dimensions
          </h3>

          {[
            { label: "Information Density", value: profile.density, low: "Spacious", high: "Dense" },
            { label: "Confidence", value: profile.confidence, low: "Supportive", high: "Self-directed" },
            { label: "Tone", value: profile.tone, low: "Warm", high: "Clinical" },
            { label: "Engagement", value: profile.engagement, low: "Absorb", high: "Challenge" },
            { label: "Candor", value: profile.candor, low: "Gentle", high: "Unfiltered" },
          ].map(dim => (
            <div key={dim.label} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: colors.textSecondary }}>{dim.low}</span>
                <span style={{ color: colors.text, fontWeight: 500 }}>{dim.label}</span>
                <span style={{ color: colors.textSecondary }}>{dim.high}</span>
              </div>
              <div style={{ height: 6, background: colors.border, borderRadius: 3, position: "relative" }}>
                <div style={{
                  position: "absolute",
                  left: ((dim.value - 1) / 4) * 100 + "%",
                  top: -4,
                  width: 14,
                  height: 14,
                  background: colors.accent,
                  borderRadius: "50%",
                  transform: "translateX(-50%)",
                  transition: "left 0.4s ease",
                }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid " + colors.border }}>
            <div style={{ display: "flex", gap: 32 }}>
              <div>
                <div style={{ fontSize: 12, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Exploration Mode</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>{EXPLORATION_LABELS[profile.exploration]}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Learning Intent</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>{INTENT_LABELS[profile.intent]}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: colors.white,
          border: "1px solid " + colors.border,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 32,
        }}>
          <div style={{
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid " + colors.border,
          }}>
            <div>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: colors.text, margin: 0, fontWeight: 600 }}>
                Your personalized prompt
              </h3>
              <p style={{ fontSize: 14, color: colors.textSecondary, margin: "4px 0 0" }}>
                Paste this at the start of any ChatGPT or Claude conversation
              </p>
            </div>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? colors.green : colors.text,
                color: colors.bg,
                border: "none",
                padding: "10px 24px",
                fontSize: 14,
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
                transition: "background 0.2s ease",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}
            >
              {copied ? "Copied \u2713" : "Copy to clipboard"}
            </button>
          </div>
          <div
            onClick={() => {
              if (!showPrompt) posthog.capture('prompt_viewed');
              setShowPrompt(!showPrompt);
            }}
            style={{ padding: "20px 32px", cursor: "pointer", background: colors.bgWarm }}
          >
            {showPrompt ? (
              <pre style={{
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: 13,
                lineHeight: 1.7,
                color: colors.text,
                whiteSpace: "pre-wrap",
                margin: 0,
              }}>
                {prompt}
              </pre>
            ) : (
              <div style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", padding: "12px 0" }}>
                Click to preview your prompt {"\u00b7"} {prompt.split(" ").length} words
              </div>
            )}
          </div>
        </div>

        <div style={{
          background: colors.accentSubtle,
          borderRadius: 16,
          padding: "32px",
          marginBottom: 60,
        }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, color: colors.text, margin: "0 0 16px", fontWeight: 600 }}>
            How to use this
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { app: "ChatGPT", instruction: "Go to Settings \u2192 Personalization \u2192 Custom Instructions \u2192 paste in \"How would you like ChatGPT to respond?\"" },
              { app: "Claude", instruction: "Go to Settings \u2192 Profile \u2192 paste as your style preference" },
              { app: "Any AI", instruction: "Paste at the start of any new conversation" },
            ].map(item => (
              <div key={item.app} style={{ display: "flex", gap: 12, fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: colors.accent, minWidth: 70 }}>{item.app}</span>
                <span style={{ color: colors.textSecondary }}>{item.instruction}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Save results section */}
        <div style={{
          background: colors.white,
          border: "1px solid " + colors.border,
          borderRadius: 16,
          padding: "32px",
          marginBottom: 60,
          textAlign: "center",
        }}>
          <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: colors.text, margin: "0 0 8px", fontWeight: 600 }}>
            Save your results
          </h3>
          <p style={{ fontSize: 14, color: colors.textSecondary, margin: "0 0 20px" }}>
            Create an account to save your learning profile and access it anytime.
          </p>

          {saveState === "saved" ? (
            <div style={{
              padding: "12px 24px",
              background: colors.greenLight,
              borderRadius: 8,
              color: colors.green,
              fontWeight: 500,
              fontSize: 14,
            }}>
              {"\u2713"} Results saved to your account
            </div>
          ) : saveState === "saving" ? (
            <div style={{ fontSize: 14, color: colors.textSecondary }}>
              Saving...
            </div>
          ) : saveState === "error" ? (
            <div>
              <div style={{ fontSize: 14, color: "#c0392b", marginBottom: 12 }}>
                Something went wrong. Please try again.
              </div>
              <button
                onClick={doSave}
                style={{
                  background: colors.text,
                  color: colors.bg,
                  border: "none",
                  padding: "10px 24px",
                  fontSize: 14,
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                  fontFamily: "inherit",
                }}
              >
                Retry save
              </button>
            </div>
          ) : isAuthenticated ? (
            <button
              onClick={doSave}
              style={{
                background: colors.text,
                color: colors.bg,
                border: "none",
                padding: "12px 28px",
                fontSize: 14,
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
                fontFamily: "inherit",
              }}
            >
              Save to my account
            </button>
          ) : (
            <div>
              <Descope
                flowId="sign-up-or-in"
                onSuccess={() => setSaveState("pending-login")}
                theme="light"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function SavedResultsPage({ savedResult, onRetake }) {
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  let dimensions, generatedPrompt, answers;
  try {
    dimensions = typeof savedResult.dimensions === "string" ? JSON.parse(savedResult.dimensions) : savedResult.dimensions;
    answers = typeof savedResult.answers === "string" ? JSON.parse(savedResult.answers) : savedResult.answers;
    generatedPrompt = savedResult.generated_prompt;
  } catch {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, padding: 40, textAlign: "center" }}>
        <p>Could not load saved results.</p>
        <button onClick={onRetake}>Retake quiz</button>
      </div>
    );
  }

  const summary = generateProfileSummary(dimensions);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      posthog.capture('prompt_copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = generatedPrompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      posthog.capture('prompt_copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg }}>
      <nav style={{
        padding: "20px 32px",
        maxWidth: 960,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: colors.text, fontWeight: 600 }}>
          memories<span style={{ color: colors.accent }}>.new</span>
        </div>
        <button
          onClick={onRetake}
          style={{
            background: "none",
            border: "1px solid " + colors.border,
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 13,
            color: colors.textSecondary,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Retake quiz
        </button>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 32px 0" }}>
        <div style={{
          display: "inline-block",
          padding: "6px 14px",
          background: colors.greenLight,
          borderRadius: 20,
          fontSize: 13,
          color: colors.green,
          marginBottom: 24,
          fontWeight: 500,
        }}>
          {"\u2713"} Saved learning profile
        </div>

        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: 32,
          lineHeight: 1.25,
          color: colors.text,
          margin: "0 0 24px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}>
          {summary.headline}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
          {summary.details.map((detail, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.6, color: colors.textSecondary, margin: 0 }}>
              {detail}
            </p>
          ))}
        </div>

        <div style={{
          background: colors.white,
          border: "1px solid " + colors.border,
          borderRadius: 16,
          padding: "32px",
          marginBottom: 32,
        }}>
          <h3 style={{
            fontFamily: "Georgia, serif",
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: colors.textSecondary,
            margin: "0 0 24px",
            fontWeight: 500,
          }}>
            Your dimensions
          </h3>

          {[
            { label: "Information Density", value: dimensions.density, low: "Spacious", high: "Dense" },
            { label: "Confidence", value: dimensions.confidence, low: "Supportive", high: "Self-directed" },
            { label: "Tone", value: dimensions.tone, low: "Warm", high: "Clinical" },
            { label: "Engagement", value: dimensions.engagement, low: "Absorb", high: "Challenge" },
            { label: "Candor", value: dimensions.candor, low: "Gentle", high: "Unfiltered" },
          ].map(dim => (
            <div key={dim.label} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: colors.textSecondary }}>{dim.low}</span>
                <span style={{ color: colors.text, fontWeight: 500 }}>{dim.label}</span>
                <span style={{ color: colors.textSecondary }}>{dim.high}</span>
              </div>
              <div style={{ height: 6, background: colors.border, borderRadius: 3, position: "relative" }}>
                <div style={{
                  position: "absolute",
                  left: ((dim.value - 1) / 4) * 100 + "%",
                  top: -4,
                  width: 14,
                  height: 14,
                  background: colors.accent,
                  borderRadius: "50%",
                  transform: "translateX(-50%)",
                }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid " + colors.border }}>
            <div style={{ display: "flex", gap: 32 }}>
              <div>
                <div style={{ fontSize: 12, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Exploration Mode</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>{EXPLORATION_LABELS[dimensions.exploration]}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Learning Intent</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>{INTENT_LABELS[dimensions.intent]}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: colors.white,
          border: "1px solid " + colors.border,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 60,
        }}>
          <div style={{
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid " + colors.border,
          }}>
            <div>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: colors.text, margin: 0, fontWeight: 600 }}>
                Your personalized prompt
              </h3>
              <p style={{ fontSize: 14, color: colors.textSecondary, margin: "4px 0 0" }}>
                Paste this at the start of any ChatGPT or Claude conversation
              </p>
            </div>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? colors.green : colors.text,
                color: colors.bg,
                border: "none",
                padding: "10px 24px",
                fontSize: 14,
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
                transition: "background 0.2s ease",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}
            >
              {copied ? "Copied \u2713" : "Copy to clipboard"}
            </button>
          </div>
          <div
            onClick={() => {
              if (!showPrompt) posthog.capture('prompt_viewed');
              setShowPrompt(!showPrompt);
            }}
            style={{ padding: "20px 32px", cursor: "pointer", background: colors.bgWarm }}
          >
            {showPrompt ? (
              <pre style={{
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: 13,
                lineHeight: 1.7,
                color: colors.text,
                whiteSpace: "pre-wrap",
                margin: 0,
              }}>
                {generatedPrompt}
              </pre>
            ) : (
              <div style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", padding: "12px 0" }}>
                Click to preview your prompt {"\u00b7"} {generatedPrompt.split(" ").length} words
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [page, setPage] = useState("landing");
  const [answers, setAnswers] = useState(null);
  const [savedResult, setSavedResult] = useState(null);
  const [handlingMagicLink, setHandlingMagicLink] = useState(
    () => new URLSearchParams(window.location.search).has("descope-login-flow")
  );
  const { isAuthenticated, isSessionLoading } = useSession();

  // On mount, if authenticated, check for saved results
  useEffect(() => {
    if (isSessionLoading || !isAuthenticated) return;
    getResultByApp("learn").then((data) => {
      if (data.result) {
        setSavedResult(data.result);
      }
    }).catch(() => {});
  }, [isAuthenticated, isSessionLoading]);

  // Handle magic link callback — render Descope to process the token
  if (handlingMagicLink) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: colors.text, fontWeight: 600, marginBottom: 32 }}>
            memories<span style={{ color: colors.accent }}>.new</span>
          </div>
          <Descope
            flowId="sign-up-or-in"
            onSuccess={() => {
              // Notify original tab that auth is done
              new BroadcastChannel("memories-auth").postMessage("authenticated");
              window.history.replaceState({}, "", "/");
              setHandlingMagicLink(false);
            }}
            onError={() => {
              window.history.replaceState({}, "", "/");
              setHandlingMagicLink(false);
            }}
            theme="light"
          />
        </div>
      </div>
    );
  }

  if (page === "quiz") {
    return (
      <QuizPage
        onComplete={(ans) => {
          setAnswers(ans);
          setSavedResult(null);
          setPage("results");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  if (page === "results" && answers) {
    return (
      <ResultsPage
        answers={answers}
        onRestart={() => {
          setAnswers(null);
          setPage("landing");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  // Show saved results for returning authenticated users
  if (savedResult && page === "landing") {
    return (
      <SavedResultsPage
        savedResult={savedResult}
        onRetake={() => {
          setSavedResult(null);
          posthog.capture('quiz_started');
          setPage("quiz");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <LandingPage
      onStart={() => {
        posthog.capture('quiz_started');
        setPage("quiz");
        window.scrollTo(0, 0);
      }}
    />
  );
}
