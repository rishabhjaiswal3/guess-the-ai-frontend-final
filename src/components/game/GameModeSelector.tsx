import type { SyntheticEvent } from "react";
import { motion } from "framer-motion";
import { Bot, UserRound } from "lucide-react";
import { GAME_MODES, GameMode, GameModeType } from "@/data/gameModes";
import { SAMPLE_IMAGES } from "@/data/sampleImages";
import { cn } from "@/lib/utils";

interface GameModeSelectorProps {
  onSelectMode: (mode: GameModeType) => void;
  onBack: () => void;
}

const previewImages: Record<GameModeType, string[]> = {
  classic: [SAMPLE_IMAGES[1].url],
  multiselect: [SAMPLE_IMAGES[4].url, SAMPLE_IMAGES[8].url, SAMPLE_IMAGES[5].url, SAMPLE_IMAGES[7].url],
  duel: [SAMPLE_IMAGES[10].url, SAMPLE_IMAGES[2].url],
  oddoneout: [
    SAMPLE_IMAGES[0].url,
    SAMPLE_IMAGES[3].url,
    SAMPLE_IMAGES[6].url,
    SAMPLE_IMAGES[4].url,
    SAMPLE_IMAGES[8].url,
    SAMPLE_IMAGES[7].url,
  ],
  cardflip: [SAMPLE_IMAGES[14].url, SAMPLE_IMAGES[15].url],
  rapidfire: [SAMPLE_IMAGES[16].url],
};

const fallbackPreviewImage = SAMPLE_IMAGES[0].url;

const handlePreviewImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  if (event.currentTarget.src !== fallbackPreviewImage) {
    event.currentTarget.src = fallbackPreviewImage;
  }
};

const cardPlacement: Record<string, string> = {
  classic: "lg:col-start-1 lg:row-start-1 lg:self-start",
  multiselect: "lg:col-start-1 lg:row-start-2 lg:self-start",
  duel: "lg:col-start-3 lg:row-start-1 lg:self-start",
  oddoneout: "lg:col-start-3 lg:row-start-2 lg:self-start",
};

const titleStyles: Record<string, string> = {
  classic: "from-cyan via-blue-300 to-magenta",
  multiselect: "from-blue-200 via-purple to-pink-400",
  duel: "from-cyan via-purple to-magenta",
  oddoneout: "from-purple via-pink-300 to-cyan",
};

const GameModePreview = ({
  mode,
  index,
  onSelectMode,
}: {
  mode: GameMode;
  index: number;
  onSelectMode: (mode: GameModeType) => void;
}) => {
  const images = previewImages[mode.id];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.08 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelectMode(mode.id)}
      className={cn(
        "group relative h-[175px] w-full overflow-hidden rounded-2xl bg-[#07042a]/80 text-left shadow-[0_0_18px_rgba(3,2,18,0.45)] backdrop-blur-md transition sm:h-[190px] lg:h-[clamp(190px,31vh,255px)] xl:h-[clamp(205px,31vh,285px)]",
        "hover:shadow-[0_0_24px_rgba(107,140,255,0.24)]",
        cardPlacement[mode.id]
      )}
    >
      {/* Moving Light Wave Background (Acts as the border) */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-white/[0.04]" />
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none opacity-80"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(107,140,255,0.4) 30%, rgba(107,140,255,1) 45%, rgba(244,80,220,1) 50%, rgba(107,140,255,1) 55%, rgba(107,140,255,0.4) 70%, transparent 100%)',
          backgroundSize: '250% 100%'
        }}
        animate={{ backgroundPosition: ["250% 0", "-150% 0"] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: index * 0.15 }}
      />

      <div className="absolute inset-[2px] z-0 overflow-hidden rounded-[14px] bg-[#07042a]">
        {mode.id === "classic" && (
          <img src={images[0]} alt="" className="h-full w-full object-cover" onError={handlePreviewImageError} />
        )}

        {mode.id === "multiselect" && (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1">
            {images.map((image) => (
              <img key={image} src={image} alt="" className="h-full min-h-0 w-full object-cover" onError={handlePreviewImageError} />
            ))}
          </div>
        )}

        {mode.id === "duel" && (
          <div className="relative grid h-full w-full grid-cols-2 gap-1">
            {images.map((image) => (
              <img key={image} src={image} alt="" className="h-full min-h-0 w-full object-cover" onError={handlePreviewImageError} />
            ))}
            <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-magenta to-purple text-xs font-black text-white shadow-[0_0_18px_rgba(180,119,255,0.5)]">
              VS
            </span>
          </div>
        )}

        {mode.id === "oddoneout" && (
          <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-1">
            {images.map((image) => (
              <img key={image} src={image} alt="" className="h-full min-h-0 w-full object-cover" onError={handlePreviewImageError} />
            ))}
          </div>
        )}
      </div>

      <div className="absolute inset-[2px] z-0 pointer-events-none rounded-[14px] bg-gradient-to-b from-black/80 via-black/20 to-black/70" />
      <div className="absolute inset-[2px] z-0 pointer-events-none rounded-[14px] bg-gradient-to-br from-cyan/10 via-transparent to-magenta/18" />

      <div className="absolute left-[2px] right-[2px] top-[2px] z-10 p-3">
        <div className="absolute inset-0 rounded-t-[14px] bg-gradient-to-b from-[#020110]/95 via-[#020110]/70 to-transparent -z-10 pointer-events-none" />
        <div className="flex items-start justify-between gap-3 relative">
          <div>
            <h3 className={cn("bg-gradient-to-r bg-clip-text text-base font-black leading-tight text-transparent xl:text-lg drop-shadow-md", titleStyles[mode.id])}>
              {mode.name}
            </h3>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold text-foreground/80">
            {mode.difficulty}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

const GameModeSelector = ({ onSelectMode }: GameModeSelectorProps) => {
  return (
    <div className="relative min-h-[100dvh] overflow-y-auto overflow-x-hidden px-4 pb-24 pt-32 lg:h-[100dvh] lg:px-6 lg:pb-24 lg:pt-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(68,85,255,0.18),transparent_32%),radial-gradient(circle_at_82%_22%,rgba(255,44,255,0.12),transparent_28%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/12 via-transparent to-background/32" />

      <div className="relative z-10 mx-auto grid min-h-full max-w-[1320px] grid-cols-1 gap-3 sm:grid-cols-2 lg:h-full lg:grid-cols-[minmax(230px,1fr)_minmax(280px,430px)_minmax(230px,1fr)] lg:grid-rows-2 lg:items-start xl:gap-4">
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="order-first flex min-h-0 flex-col items-center justify-center py-3 text-center sm:col-span-2 lg:col-span-1 lg:col-start-2 lg:row-span-2 lg:h-full lg:py-0"
        >
          <div className="relative mb-2">
            <div className="absolute -inset-5 rounded-full bg-cyan/20 blur-3xl" />
            <img
              src="/logo.png"
              alt="Guess The AI logo"
              className="relative h-48 w-48 object-contain drop-shadow-[0_0_32px_rgba(107,240,255,0.7)] sm:h-56 sm:w-56 lg:h-[clamp(200px,32vh,300px)] lg:w-[clamp(200px,32vh,300px)] xl:h-[clamp(240px,38vh,380px)] xl:w-[clamp(240px,38vh,380px)]"
            />
          </div>

          <h1
            className="mt-4 bg-clip-text text-3xl font-black leading-none text-transparent drop-shadow-[0_0_18px_rgba(95,156,255,0.38)] sm:text-4xl lg:text-[clamp(2rem,5vh,2.5rem)] xl:text-[clamp(2.3rem,5vh,3rem)]"
            style={{
              backgroundImage: "linear-gradient(90deg, #27e7ff 0%, #5f9cff 34%, #9b64ff 68%, #f02cff 100%)",
            }}
          >
            GUESS THE AI
          </h1>
          <p className="mt-2 max-w-sm text-xs font-medium text-foreground/72">
            Pick a mode and test whether your eye can catch the machine-made image.
          </p>

          <div className="mt-3 grid w-full max-w-sm grid-cols-2 gap-3" aria-hidden="true">
            <div className="flex h-11 cursor-default select-none items-center justify-center gap-2 rounded-xl border-2 border-cyan/60 bg-blue-600/35 text-lg font-black text-white/85 shadow-[0_0_20px_rgba(107,140,255,0.32)] lg:h-12 lg:text-xl">
              <Bot className="h-5 w-5 lg:h-6 lg:w-6" />
              AI
            </div>
            <div className="flex h-11 cursor-default select-none items-center justify-center gap-2 rounded-xl border-2 border-pink-300/60 bg-fuchsia-600/35 text-lg font-black text-white/85 shadow-[0_0_20px_rgba(244,80,220,0.3)] lg:h-12 lg:text-xl">
              <UserRound className="h-5 w-5 lg:h-6 lg:w-6" />
              HUMAN
            </div>
          </div>
        </motion.section>

        {GAME_MODES.map((mode, index) => (
          <GameModePreview
            key={mode.id}
            mode={mode}
            index={index}
            onSelectMode={onSelectMode}
          />
        ))}
      </div>
    </div>
  );
};

export default GameModeSelector;
