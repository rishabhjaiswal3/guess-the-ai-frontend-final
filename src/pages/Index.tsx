import { useState, useCallback, Suspense, lazy, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import BottomNav, { TabType } from "@/components/BottomNav";
import GameScreen from "@/components/game/GameScreen";
import LeaderboardScreen from "@/components/game/LeaderboardScreen";
import ProfileScreen from "@/components/game/ProfileScreen";
import WalletScreen from "@/components/game/WalletScreen";
import AuthGate from "@/components/auth/AuthGate";
import { useAuth } from "@/context/AuthContext";
import { useGameRecorder } from "@/hooks/useGameRecorder";
import RecordingWidget from "@/components/game/RecordingWidget";
import ReplayModal from "@/components/game/ReplayModal";

// Lazy load the 3D background for better performance
const Background3D = lazy(() => import("@/components/Background3D"));

const LoadingBackground = () => (
  <div className="fixed inset-0 z-0 bg-gradient-to-br from-background via-background to-background">
    <div className="absolute inset-0 bg-gradient-to-b from-cyan/10 via-transparent to-magenta/10" />
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("game");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const { token } = useAuth();
  
  const { 
    startRecording, 
    stopRecording, 
    isRecording, 
    videoBlob, 
    stats, 
    clearRecording 
  } = useGameRecorder();

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<TabType>;
      if (custom.detail) {
        setActiveTab(custom.detail);
      }
    };
    window.addEventListener("gta:set-tab", handler as EventListener);
    return () => window.removeEventListener("gta:set-tab", handler as EventListener);
  }, []);

  const handleScoreUpdate = useCallback((newScore: number, newStreak: number, newBestStreak: number) => {
    setScore(newScore);
    setStreak(newStreak);
    setBestStreak(newBestStreak);
  }, []);

  const handleStartRec = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      startRecording(canvas);
    } else {
      console.warn("[Recorder] No canvas found to record");
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case "game":
        return <GameScreen key="game" onScoreUpdate={handleScoreUpdate} />;
      case "leaderboard":
        return <LeaderboardScreen key="leaderboard" />;
      case "profile":
        return <ProfileScreen key="profile" score={score} streak={streak} bestStreak={bestStreak} />;
      case "wallet":
        return <WalletScreen key="wallet" />;
      default:
        return <GameScreen key="game-default" onScoreUpdate={handleScoreUpdate} />;
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Suspense fallback={<LoadingBackground />}>
        <Background3D />
      </Suspense>
      
      <Header onLogoClick={() => setActiveTab("game")} />

      {token && (
        <RecordingWidget 
          isRecording={isRecording} 
          onStart={handleStartRec} 
          onStop={stopRecording} 
          stats={stats}
        />
      )}

      <ReplayModal 
        blob={videoBlob} 
        onClose={clearRecording} 
      />
      
      <main className="relative z-10">
        <AuthGate>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </AuthGate>
      </main>
      
      {token ? (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      ) : null}
    </div>
  );
};

export default Index;
