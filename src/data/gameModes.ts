export type GameModeType = "classic" | "multiselect" | "duel" | "oddoneout" | "cardflip" | "rapidfire";

export interface GameMode {
  id: GameModeType;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  color: string;
  glowColor: "cyan" | "magenta" | "purple" | "rainbow";
  rules: string[];
  bestFor: string;
}

export const GAME_MODES: GameMode[] = [
  {
    id: "classic",
    name: "Classic Mode",
    shortName: "Classic",
    description: "One image at a time. Is it AI or Human?",
    icon: "🎯",
    difficulty: "Easy",
    color: "from-cyan to-blue-500",
    glowColor: "cyan",
    rules: [
      "Single image appears",
      "Choose AI or Human",
      "10 seconds per image",
      "Build streaks for bonus points"
    ],
    bestFor: "Beginners & Practice"
  },
  {
    id: "multiselect",
    name: "Multi-Select",
    shortName: "Multi",
    description: "6 images shown. Select ALL the AI-generated ones!",
    icon: "🎪",
    difficulty: "Hard",
    color: "from-purple to-pink-500",
    glowColor: "purple",
    rules: [
      "6 images displayed at once",
      "Tap to select AI images",
      "Submit when ready",
      "Points for each correct selection"
    ],
    bestFor: "Pattern Recognition"
  },
  {
    id: "duel",
    name: "Duel Mode",
    shortName: "Duel",
    description: "2 images side by side. Normal or Speed Blitz!",
    icon: "⚔️",
    difficulty: "Medium",
    color: "from-green-500 to-emerald-500",
    glowColor: "cyan",
    rules: [
      "Two images shown",
      "One is AI, one is Human",
      "Pick the AI one",
      "Speed Blitz: 3 seconds only!"
    ],
    bestFor: "Comparison Skills"
  },
  {
    id: "oddoneout",
    name: "Odd One Out",
    shortName: "Odd",
    description: "5 images of same type, 1 is different. Find it!",
    icon: "🎭",
    difficulty: "Hard",
    color: "from-indigo-500 to-violet-500",
    glowColor: "purple",
    rules: [
      "5 images displayed",
      "4 are same type (AI or Human)",
      "1 is the opposite",
      "Find the odd one"
    ],
    bestFor: "Critical Thinking"
  }
];

export const getGameMode = (id: GameModeType): GameMode | undefined => {
  return GAME_MODES.find(mode => mode.id === id);
};
