import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Zap, Clock, Target } from "lucide-react";
import { GAME_MODES, GameModeType, GameMode } from "@/data/gameModes";
import GlowingBorder from "@/components/effects/GlowingBorder";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface GameModeSelectorProps {
  onSelectMode: (mode: GameModeType) => void;
  onBack: () => void;
}

const difficultyColors = {
  Easy: "text-green-400 bg-green-400/20",
  Medium: "text-yellow bg-yellow/20",
  Hard: "text-orange bg-orange/20",
  Expert: "text-destructive bg-destructive/20",
};

const GameModeSelector = ({ onSelectMode, onBack }: GameModeSelectorProps) => {
  const isAvailable = (_modeId: string) => true;
  const [rulesMode, setRulesMode] = useState<GameModeType | null>(null);

  const pointsRules: Record<GameModeType, string[]> = useMemo(() => ({
    classic: [
      "Correct answer: +1",
      "Wrong answer: 0",
    ],
    multiselect: [
      "Per image: +1 if correctly selected / correctly left unselected",
      "Per image: 0 if wrong",
      "If any wrong image is selected, round score becomes 0",
      "Round score = total correct images",
    ],
    duel: [
      "Normal: correct +1, wrong 0",
      "Speed: correct +2, wrong -1",
    ],
    oddoneout: [
      "Correct answer: +5",
      "Wrong answer: 0",
    ],
    cardflip: [
      "Per card correct: +1",
      "Per card wrong: 0",
    ],
    rapidfire: [
      "Every correct answer: +3",
      "Every wrong answer: -1",
    ],
  }), []);

  const renderCard = (mode: GameMode, index: number) => {
    const available = isAvailable(mode.id);

    return (
      <motion.div
        key={mode.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <GlowingBorder
          glowColor={available ? mode.glowColor : "purple"}
          intensity={available ? "low" : "low"}
          className="rounded-2xl h-full"
          animated={false}
        >
          <motion.button
            whileTap={available ? { scale: 0.98 } : undefined}
            onClick={() => available && onSelectMode(mode.id)}
            disabled={!available}
            className={cn(
              "w-full h-full glass-strong rounded-2xl p-4 lg:p-8 text-left transition-all group relative min-h-[170px] lg:min-h-[320px] flex flex-col",
              available ? [
                mode.glowColor === "cyan" && "hover:border-cyan/50 hover:shadow-[0_0_25px_rgba(0,255,255,0.15)]",
                mode.glowColor === "magenta" && "hover:border-magenta/50 hover:shadow-[0_0_25px_rgba(255,0,255,0.15)]",
                mode.glowColor === "purple" && "hover:border-purple/50 hover:shadow-[0_0_25px_rgba(139,92,246,0.15)]",
                mode.glowColor === "rainbow" && "hover:border-primary/50 hover:shadow-[0_0_25px_rgba(0,255,255,0.15)]",
                "cursor-pointer"
              ] : "opacity-60 cursor-not-allowed"
            )}
          >
            {/* Coming Soon Overlay */}
            {!available && (
              <div className="absolute top-3 right-3 lg:top-4 lg:right-4 z-10">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-muted-foreground/20 text-muted-foreground border border-muted-foreground/30">
                  Coming Soon
                </span>
              </div>
            )}

            {/* Icon & Title Row */}
            <div className="flex items-start justify-between mb-2 lg:mb-6">
              <span className="text-4xl lg:text-5xl">
                {mode.icon}
              </span>
              {available && (
                <span className={cn(
                  "px-2 py-1 lg:px-3 lg:py-1.5 rounded-full text-xs lg:text-sm font-bold",
                  difficultyColors[mode.difficulty]
                )}>
                  {mode.difficulty}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className={cn(
              "text-lg md:text-2xl lg:text-3xl font-black mb-1 lg:mb-3 bg-gradient-to-r bg-clip-text text-transparent",
              available ? mode.color : "from-muted-foreground to-muted-foreground"
            )}>
              {mode.name}
            </h3>

            {/* Description */}
            <p className="text-xs md:text-base lg:text-lg text-muted-foreground mb-2 lg:mb-6">
              {mode.description}
            </p>

            {/* Best For Tag */}
            <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground mt-auto">
              <Target className="w-3 h-3 lg:w-4 lg:h-4" />
              <span>{mode.bestFor}</span>
            </div>

            {available && (
              <div className="mt-2">
                <span
                  className="inline-flex h-8 items-center rounded-md border border-border/60 bg-background/30 px-3 text-xs font-medium text-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    setRulesMode(mode.id);
                  }}
                >
                  View Rules
                </span>
              </div>
            )}

            {/* Hover Arrow - only for available modes */}
            {available && (
              <motion.div
                className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <span className="text-primary text-xl lg:text-2xl">→</span>
              </motion.div>
            )}
          </motion.button>
        </GlowingBorder>
      </motion.div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] px-4 pt-[4rem] pb-28 lg:pb-6 overflow-y-auto lg:overflow-hidden">
      <div className="max-w-6xl m-auto flex flex-col mt-6 lg:mt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3 lg:mb-4"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-5xl mb-2"
          >
            🎮
          </motion.div>
          <h1 className="text-2xl md:text-4xl font-black gradient-text mb-1 lg:mb-2">
            Choose Your Challenge
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Multiple ways to test your AI detection skills
          </p>
        </motion.div>

        {/* Game Mode Grid (mobile/tablet) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1 lg:hidden">
          {GAME_MODES.map((mode, index) => renderCard(mode, index))}
        </div>

        {/* Desktop Carousel */}
        <div className="hidden lg:block mb-10 mt-6 px-12">
          <Carousel opts={{ align: "start", loop: true }}>
            <CarouselContent>
              {GAME_MODES.map((mode, index) => (
                <CarouselItem key={mode.id} className="basis-5/12">
                  {renderCard(mode, index)}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 border-cyan/40 text-cyan hover:bg-cyan/10" />
            <CarouselNext className="right-0 border-cyan/40 text-cyan hover:bg-cyan/10" />
          </Carousel>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-4  text-xs text-muted-foreground"
        >
          {[
            { icon: Star, label: "4 Modes", color: "text-yellow" },
            { icon: Zap, label: "Endless Fun", color: "text-primary" },
            { icon: Clock, label: "Quick Games", color: "text-secondary" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
              <span>{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <Dialog open={Boolean(rulesMode)} onOpenChange={(open) => !open && setRulesMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rulesMode ? `${GAME_MODES.find((mode) => mode.id === rulesMode)?.name || "Game"} Rules` : "Game Rules"}
            </DialogTitle>
            <DialogDescription>
              Point system for this mode.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm text-foreground">
            {(rulesMode ? pointsRules[rulesMode] : []).map((line) => (
              <div key={line} className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                {line}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameModeSelector;
