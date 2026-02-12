export const EXPLORATION_LABELS = {
  "explorer": "Explorer",
  "problem-solver": "Problem Solver",
  "deep-diver": "Deep Diver",
  "connector": "Connector"
};

export const INTENT_LABELS = {
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

export function generateProfileSummary(profile) {
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
