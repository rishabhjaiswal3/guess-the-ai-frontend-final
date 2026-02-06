// Extended sample images for multi-image game modes
// In production, these would come from a backend API

export interface GameImage {
  id: string;
  url: string;
  isAI: boolean;
  source?: string;
}

// More images for variety in multi-select games
export const SAMPLE_IMAGES: GameImage[] = [
  // Human/Real images
  {
    id: "h1",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
    isAI: false,
    source: "Mountain landscape",
  },
  {
    id: "h2",
    url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600",
    isAI: false,
    source: "Japanese temple",
  },
  {
    id: "h3",
    url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600",
    isAI: false,
    source: "Cat portrait",
  },
  {
    id: "h4",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600",
    isAI: false,
    source: "Foggy forest",
  },
  {
    id: "h5",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600",
    isAI: false,
    source: "Nature valley",
  },
  {
    id: "h6",
    url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600",
    isAI: false,
    source: "Forest path",
  },
  {
    id: "h7",
    url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600",
    isAI: false,
    source: "Waterfall",
  },
  {
    id: "h8",
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600",
    isAI: false,
    source: "Lake reflection",
  },
  {
    id: "h9",
    url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600",
    isAI: false,
    source: "Green hills",
  },
  {
    id: "h10",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
    isAI: false,
    source: "Portrait man",
  },
  // AI Generated images (using abstract/surreal images as stand-ins)
  {
    id: "a1",
    url: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600",
    isAI: true,
    source: "AI Fantasy scene",
  },
  {
    id: "a2",
    url: "https://images.unsplash.com/photo-1686904423091-52df0c6e7b2c?w=600",
    isAI: true,
    source: "AI Surreal art",
  },
  {
    id: "a3",
    url: "https://images.unsplash.com/photo-1684779847639-fbcc5a57dfe9?w=600",
    isAI: true,
    source: "AI Digital art",
  },
  {
    id: "a4",
    url: "https://images.unsplash.com/photo-1699839412919-7c6d0c055b29?w=600",
    isAI: true,
    source: "AI Portrait",
  },
  {
    id: "a5",
    url: "https://images.unsplash.com/photo-1683009427666-340595e57e43?w=600",
    isAI: true,
    source: "AI Landscape",
  },
  {
    id: "a6",
    url: "https://images.unsplash.com/photo-1684779847639-fbcc5a57dfe9?w=600",
    isAI: true,
    source: "AI Abstract",
  },
  {
    id: "a7",
    url: "https://images.unsplash.com/photo-1680453568659-1cf8d16bf341?w=600",
    isAI: true,
    source: "AI Creature",
  },
  {
    id: "a8",
    url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600",
    isAI: true,
    source: "AI City",
  },
  {
    id: "a9",
    url: "https://images.unsplash.com/photo-1675271591211-126ad94e495d?w=600",
    isAI: true,
    source: "AI Pattern",
  },
  {
    id: "a10",
    url: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?w=600",
    isAI: true,
    source: "AI Scene",
  },
];

export const getRandomImage = (excludeIds: string[] = []): GameImage | null => {
  const available = SAMPLE_IMAGES.filter((img) => !excludeIds.includes(img.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

export const getRandomImages = (count: number, excludeIds: string[] = []): GameImage[] => {
  const available = SAMPLE_IMAGES.filter((img) => !excludeIds.includes(img.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getRandomAIImages = (count: number, excludeIds: string[] = []): GameImage[] => {
  const available = SAMPLE_IMAGES.filter((img) => img.isAI && !excludeIds.includes(img.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getRandomHumanImages = (count: number, excludeIds: string[] = []): GameImage[] => {
  const available = SAMPLE_IMAGES.filter((img) => !img.isAI && !excludeIds.includes(img.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Get a mixed set with specific AI count
export const getMixedImages = (totalCount: number, aiCount: number): GameImage[] => {
  const aiImages = getRandomAIImages(aiCount);
  const humanImages = getRandomHumanImages(totalCount - aiCount);
  return [...aiImages, ...humanImages].sort(() => Math.random() - 0.5);
};
