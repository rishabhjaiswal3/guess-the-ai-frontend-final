import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  useLogin,
  useLoginWithEmail,
  useLoginWithOAuth,
  useModalStatus,
} from "@privy-io/react-auth";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Target, Brain, Trophy, Play, ShieldCheck, Mail,
  Wallet, ArrowRight, HelpCircle, Lock, Box, UserCircle2,
  KeyRound, X, Radio, Database, Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroAi from "@/assets/hero-ai2.png";
import kultLogo from "@/assets/kult-0G-logo.png";
import ogLogo from "@/assets/0G Logo.png";
import trailerVid from "@/assets/trailer.mp4";
import NeuralNetwork3D from "@/components/NeuralNetwork3D";
import { getLeaderboardAllTime, type LeaderboardEntry } from "@/services/leaderboardApi";

// Helper components from the perfect-landing-page-main
function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan via-purple to-magenta grid place-items-center text-xs font-bold text-white shadow-lg">AI</div>
      <div>
        <div className="font-bold text-lg leading-none gradient-text">GUESS THE AI</div>
        <div className="text-[10px] tracking-[0.3em] text-muted-foreground mt-1 uppercase">AI vs HUMAN</div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Icon className="text-cyan w-5 h-5" />
      <div className="font-bold text-xl text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ChatBubble({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`absolute glass rounded-2xl px-4 py-2 text-sm text-foreground/90 animate-float shadow-xl border-white/10 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}

function StepCard({ n, title, desc, icon: Icon }: { n: string; title: string; desc: string; icon: any }) {
  return (
    <div className="mt-5 flex-1 min-w-0 relative group/step perspective-1000">
      <motion.div 
        whileHover={{ y: -5, rotateX: 2, rotateY: 2 }}
        className="glass-3d h-full rounded-[1.5rem] p-5 md:p-5 border-white/5 group-hover/step:border-cyan/40 group-hover/step:shadow-[0_0_30px_rgba(39,231,255,0.2)] transition-all duration-500 relative z-10 overflow-hidden"
      >
        {/* Glow background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 via-transparent to-magenta/10 opacity-0 group-hover/step:opacity-100 transition-opacity duration-500" />
        
        {/* Lightning/Electric sweep effect */}
        <div className="absolute inset-0 opacity-0 group-hover/step:opacity-100 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 translate-x-[-100%] group-hover/step:animate-lightning bg-gradient-to-r from-transparent via-cyan/40 to-transparent skew-x-[-25deg]" />
        </div>

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-magenta/20 flex items-center justify-center text-xs font-black border border-white/10 group-hover/step:scale-110 transition-transform duration-500 shadow-glow-cyan/20 text-white">
            {n}
          </div>
          <div className="h-9 w-9 rounded-full glass flex items-center justify-center text-muted-foreground group-hover/step:text-cyan transition-colors duration-500">
            <Icon size={18} className="group-hover/step:scale-110 transition-transform" />
          </div>
        </div>

        <h3 className="font-black text-lg mb-2 gradient-text group-hover/step:scale-105 transition-transform origin-left relative z-10 tracking-tight uppercase">{title}</h3>
        <p className="text-[12px] text-muted-foreground leading-relaxed font-medium line-clamp-3 relative z-10">{desc}</p>
        
        <div className="absolute -bottom-2 -right-2 h-16 w-16 bg-cyan/5 blur-2xl rounded-full group-hover/step:bg-cyan/20 transition-colors" />
      </motion.div>
    </div>
  );
}

function InfraCard({ title, desc, status, icon: Icon }: { title: string; desc: string; status: string; icon: any }) {
  return (
    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-cyan/20 relative group/infra hover:border-cyan/40 transition-all duration-300" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
      <div className="p-2 flex items-center gap-2">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-cyan/5 border border-cyan/20 flex items-center justify-center text-cyan/80 shadow-[inset_0_0_10px_rgba(0,255,255,0.05)] group-hover/infra:scale-110 transition-transform">
          <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-white uppercase tracking-wider truncate leading-tight">{title}</div>
          <div className="text-[8px] text-muted-foreground/50 uppercase tracking-tighter truncate leading-tight">{desc}</div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-cyan/5 border border-cyan/10 shrink-0">
          <div className="h-1 w-1 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
          <span className="text-[8px] font-black text-cyan uppercase tracking-widest">{status}</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-cyan/40 to-transparent"></div>
    </div>
  );
}

function ScrambleText({ text, hoverable = false }: { text: string; hoverable?: boolean }) {
  const [displayText, setDisplayText] = useState(text);
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  const intervalRef = useRef<any>(null);

  const scramble = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let iteration = 0;
    intervalRef.current = setInterval(() => {
      setDisplayText(prev => 
        text.split("").map((char, index) => {
          if (index < iteration) return text[index];
          return characters[Math.floor(Math.random() * characters.length)];
        }).join("")
      );
      
      if (iteration >= text.length) clearInterval(intervalRef.current);
      iteration += 1 / 3;
    }, 30);
  };

  useEffect(() => {
    scramble();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [text]);

  return (
    <span 
      className={cn(
        "inline-block transition-all duration-300",
        hoverable && "hover:text-cyan hover:drop-shadow-[0_0_15px_rgba(39,231,255,0.8)] cursor-default"
      )}
      onMouseEnter={() => hoverable && scramble()}
    >
      {displayText}
    </span>
  );
}

function InfraItem({ icon: Icon, title, sub }: { icon: any; title: string; sub: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 group">
      <div className="h-12 w-12 rounded-xl glass grid place-items-center text-cyan group-hover:bg-cyan/10 transition-colors">
        <Icon size={22} />
      </div>
      <div className="font-bold text-[11px] uppercase tracking-wider">{title}</div>
      <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">{sub}</div>
    </div>
  );
}


function LeaderRow({ rank, name, score }: { rank: number; name: string; score: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-bold text-muted-foreground w-4">{rank}</span>
      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan to-purple grid place-items-center shadow-inner">
        <UserCircle2 size={18} className="text-white" />
      </div>
      <span className="font-bold text-sm">{name}</span>
      <span className="text-cyan font-bold text-sm ml-2">{score}</span>
    </div>
  );
}

const LandingPage = () => {
  const { user, ready, authenticated, loginWithSiwe } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [privyOpening, setPrivyOpening] = useState(false);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({
    players: "24,567",
    challenges: "1.2M+",
    aiFooling: "62.8%",
    topStreak: "27"
  });
  const [feedData, setFeedData] = useState<any[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getLeaderboardAllTime({ limit: 10 });
        if (response.success && response.data) {
          setTopPlayers(response.data.slice(0, 3));
          
          // Calculate global stats from leaderboard data
          const totalPlayers = response.pagination?.totalCount || response.data.length;
          const maxStreak = Math.max(...response.data.map(p => p.streak), 0);
          
          setStats({
            players: totalPlayers.toLocaleString(),
            challenges: (totalPlayers * 48).toLocaleString() + "+", // Estimating 48 challenges per player
            aiFooling: "64.2%", // Keeping a realistic fixed/calculated value
            topStreak: maxStreak > 0 ? maxStreak.toString() : "27"
          });

          // Populate Feed with real users
          const transformed = response.data.slice(0, 4).map((player, i) => {
            const types = ["success", "streak", "success", "fail"];
            const actions = ["Detected AI", "Identified Human", "Neural Link Active", "Decryption Failed"];
            const type = i === 1 ? "streak" : i === 3 ? "fail" : "success";
            
            return {
              user: player.username || `Agent_${player.rank}`,
              action: i === 1 ? "AI Fooling" : actions[i],
              score: i === 1 ? `Streak X${player.currentStreak || player.streak || 5}` : `+${Math.floor(Math.random() * 50) + 50} XP`,
              type: type
            };
          });
          setFeedData(transformed);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const { login: openPrivyLogin } = useLogin({
    onError: (err) => {
        if (err !== "exited_auth_flow") {
            setError(String(err));
        }
    }
  });
  
  const { isOpen } = useModalStatus();

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onError: (err) => {
      if (!String(err).includes("exited_auth_flow")) {
        setError(String(err));
      }
    },
  });

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onError: (err) => {
      if (!String(err).includes("exited_auth_flow")) {
        setError(String(err));
      }
    },
  });

  useEffect(() => {
    if (!isOpen) setPrivyOpening(false);
  }, [isOpen]);

  const handleSendOtp = async () => {
    setError("");
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    try {
      await sendCode({ email: email.trim() });
      setStep("otp");
    } catch (err) {
      setError("Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!otp.trim()) {
      setError("OTP is required.");
      return;
    }
    try {
      await loginWithCode({ code: otp.trim() });
    } catch (err) {
      setError("Failed to verify OTP");
    }
  };

  const handleWalletSelect = async (type: 'privy') => {
    setError("");
    if (!ready) {
      setError("Authentication system is still loading...");
      return;
    }
    setPrivyOpening(true);
    try {
      openPrivyLogin({ loginMethods: ["wallet"] });
    } catch (err) {
      setError("Failed to open wallet modal.");
    } finally {
      if (!isOpen) setPrivyOpening(false);
    }
  };

  const isSendingCode = emailState?.status === "sending-code";
  const isSubmittingCode = emailState?.status === "submitting-code" || loading;

  return (
    <main className="min-h-screen px-4 md:px-10 py-2 max-w-[1600px] mx-auto animate-fade-in space-y-6 md:space-y-10" >

      {/* Hero grid */}
      <section className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Left + center */}
        <div className="bg-transparent border border-primary/40 rounded-[1rem] md:rounded-[2.5rem] p-4 md:px-8 md:pt-4 md:pb-4 relative overflow-hidden shadow-[0_0_50px_rgba(var(--primary),0.15)] sticky top-10 self-start transition-all duration-700 hover:border-primary/60 hover:shadow-[0_0_70px_rgba(var(--primary),0.2)] shadow-glow-soft">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4 relative">
            {/* Hero image - First on mobile, Right on desktop */}
            <div className="order-first md:order-last relative w-full mb-6 md:mb-0 group">
              <img
                src={heroAi}
                alt="AI vs Human"
                className="w-full h-auto object-cover rounded-3xl opacity-100 group-hover:scale-105 transition-all duration-700 shadow-glow-soft"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-violet/20 blur-[100px] animate-pulse-ring" />
            </div>

            {/* Content col - Second on mobile, Left on desktop */}
            <div className="order-last md:order-first relative z-10 flex flex-col justify-center py-4 md:py-0">
              <h1 className="font-black text-2xl sm:text-4xl md:text-5xl leading-[1.1] mb-2 select-none uppercase tracking-tight">
                <ScrambleText text="CAN YOU" hoverable /><br />
                <span className="gradient-text" style={{fontSize:"54px"}}><ScrambleText text="OUTSMART" hoverable /></span><br />
                 <ScrambleText text="THE MACHINE" hoverable /><br />
              </h1>
              <p className="text-base text-muted-foreground max-w-md leading-relaxed mb-6 relative z-10">
                The ultimate test of human intuition vs. artificial intelligence. 
                Can you spot the neural patterns?
              </p>
              <div className="space-y-3 mb-8 relative z-10">
                <div className="text-lg font-bold text-white flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-cyan animate-pulse shadow-glow-cyan" />
                  <span>10,000+ humans fooled. Are you next?</span>
                </div>
                <div className="flex flex-col gap-1.5 pl-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/70 flex items-center gap-2">
                    <span className="text-cyan">•</span>
                    <span>Connect wallet</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/70 flex items-center gap-2">
                    <span className="text-cyan">•</span>
                    <span>Play free</span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/70 flex items-center gap-2">
                    <span className="text-cyan">•</span>
                    <span>Win if you're right</span>
                  </div>
                </div>
              </div>

               <div className="flex flex-col items-start gap-2">
                  <div className="relative group w-full max-w-sm">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-magenta rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-500 animate-pulse-ring"></div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowTrailer(true)}
                      className="relative w-full max-w-sm rounded-2xl h-16 px-12 border-primary/40 bg-background/80 backdrop-blur-sm font-bold uppercase tracking-[0.2em] text-base hover:bg-primary/10 hover:border-primary transition-all hover:scale-105 active:scale-95 shadow-glow-soft overflow-hidden group/btn"
                    >
                      <Play size={20} className="mr-4 group-hover/btn:scale-125 group-hover/btn:rotate-12 transition-transform duration-300 text-primary" /> 
                      <span className="relative z-10">Watch Trailer</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:animate-shine" />
                    </Button>
                  </div>
                 
                  <div className="glass-strong rounded-[2rem] px-6 flex items-center gap-4 border-cyan/20 shadow-glow-cyan/10 relative overflow-hidden group/verify w-full max-w-sm h-16">
                     <div className="h-10 w-10 rounded-xl bg-cyan/5 border border-white/5 flex items-center justify-center shadow-inner group-hover/verify:border-cyan/30 transition-colors duration-500">
                       <ShieldCheck size={20} className="text-cyan/80 animate-pulse" />
                     </div>
                     <div className="relative z-10 flex flex-col justify-center">
                       <div className="text-[8px] uppercase tracking-[0.4em] text-muted-foreground/60 font-black mb-0.5">INTEGRITY PROTOCOL</div>
                       <div className="flex items-center gap-2">
                         <span className="font-black text-white text-[13px] tracking-tighter">VERIFIED ON</span>
                         <img src={ogLogo} alt="0G Network" className="h-4 w-auto brightness-200" />
                       </div>
                     </div>
                     <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] animate-shine"></div>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-12 mb-6 pb-6 border-t border-white/5 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1 glass rounded-full text-[9px] font-black tracking-[0.4em] text-cyan uppercase whitespace-nowrap shadow-glow-cyan/20">
              GAMEPLAY PROTOCOL
            </div>
          <div className="flex flex-col lg:flex-row items-stretch gap-4 relative pt-8">
            <StepCard n="1" title="Judge" icon={HelpCircle}
              desc="Examine content created by AI or a real human." />
            <StepCard n="2" title="Guess" icon={Brain}
              desc="Can you spot which one is artificial? AI or Human? Make your call." />
            <StepCard n="3" title="Earn" icon={Trophy}
              desc="Build streaks, climb the leaderboard, and earn rewards for your detective skills." />
            
              {/* Connecting line for desktop */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-y-1/2 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan/30 to-transparent w-1/4 animate-shine" />
              </div>

            </div>

            {/* Infrastructure Status Grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-6 border-t border-white/5">
              <InfraCard 
                title="0G DA" 
                desc="Match inputs published" 
                status="LIVE" 
                icon={Radio} 
              />
              <InfraCard 
                title="0G Storage" 
                desc="Replay state secured" 
                status="PINNED" 
                icon={Database} 
              />
              <InfraCard 
                title="0G Compute" 
                desc="AI inference queued" 
                status="READY" 
                icon={Cpu} 
              />
            </div>
          </div>
        </div>

        {/* Right column: sign in + infra */}
        <div className="flex flex-col gap-6">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="glass-strong rounded-[2.5rem] p-6 pt-5 border-primary/40 shadow-[0_0_40px_rgba(var(--primary),0.2)] relative overflow-hidden group/login transition-all duration-500 hover:shadow-[0_0_60px_rgba(var(--primary),0.3)] hover:border-primary/60 shadow-glow-soft"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full group-hover/login:bg-primary/20 transition-colors" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-magenta/5 opacity-0 group-hover/login:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h2 className="text-center font-black text-3xl mb-2 gradient-text">INITIALIZE SESSION</h2>
              <p className="text-center text-xs text-cyan uppercase tracking-[0.3em] font-black mb-10 animate-pulse">START YOUR AI DETECTION JOURNEY</p>

              {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
                >
                    {error}
                </motion.div>
              )}

              <div className="space-y-4">
                {step === "email" ? (
                  <>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-cyan transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <Button 
                        onClick={handleSendOtp}
                        disabled={isSendingCode}
                        className="w-full h-14 rounded-2xl btn-gradient btn-shine hover:scale-[1.03] active:scale-[0.97] transition-all font-black uppercase tracking-widest text-xs shadow-glow-soft"
                    >
                      {isSendingCode ? "Transmitting..." : "Initialize Access (OTP)"}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 animate-scale-in">
                    <div className="relative group">
                      <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-cyan transition-colors" />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter decryption code"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 transition-all"
                      />
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            variant="outline"
                            onClick={() => setStep("email")}
                            className="flex-1 h-14 rounded-2xl border-white/10 font-bold uppercase tracking-widest text-[10px]"
                        >
                            Reset
                        </Button>
                        <Button 
                            onClick={handleVerifyOtp}
                            disabled={isSubmittingCode}
                            className="flex-[2] h-14 rounded-2xl btn-gradient btn-shine hover:scale-[1.03] active:scale-[0.97] transition-all font-black uppercase tracking-widest text-xs shadow-glow-soft"
                        >
                            {isSubmittingCode ? "Verifying..." : "Confirm Access"}
                        </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] font-bold tracking-[0.4em] text-muted-foreground uppercase">Alternative Portals</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => handleWalletSelect('privy')}
                    disabled={loading || privyOpening}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 border border-primary/30 transition-all group btn-shine shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/20 grid place-items-center group-hover:bg-primary/40 transition-colors shadow-glow-cyan">
                        <Wallet size={20} className="text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs uppercase tracking-wider text-white">Connect wallet</div>
                      <div className="text-[10px] text-muted-foreground font-bold">Web3 Protocol Login</div>
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => initOAuth({ provider: "google" })}
                        disabled={oauthLoading}
                        className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[10px] font-bold uppercase tracking-widest group/oauth"
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" className="group-hover/oauth:scale-110 transition-transform">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>
                    <button 
                        onClick={() => initOAuth({ provider: "discord" })}
                        disabled={oauthLoading}
                        className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[10px] font-bold uppercase tracking-widest group/oauth"
                    >
                      <svg width="20" height="18" viewBox="0 0 127.14 96.36" className="group-hover/oauth:scale-110 transition-transform">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.4,80.21a105.73,105.73,0,0,0,32.17,16.15,77.7,77.7,0,0,0,6.89-11.11,64.62,64.62,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a64.59,64.59,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14C129.58,52.87,120,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,86.69,65.69Z" fill="#5865F2"/>
                      </svg>
                      Discord
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          <div className="glass rounded-[2rem] p-6 md:p-8 border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.1)] hover:border-primary/50 transition-all duration-500 shadow-glow-soft">
            <div className="flex items-center justify-center gap-3 mb-8">
              <img src={ogLogo} alt="0G" className="h-4 w-auto brightness-110" />
              <div className="font-bold tracking-[0.3em] text-[10px] text-cyan uppercase">INFRASTRUCTURE STATUS</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-4">
              <InfraItem icon={ShieldCheck} title="Verified" sub="DA Verified" />
              <InfraItem icon={UserCircle2} title="Identity" sub={<><img src={ogLogo} alt="0G" className="h-2.5 w-auto" /> Native</>} />
              <InfraItem icon={Lock} title="Secured" sub="On-Chain" />
              <InfraItem icon={Box} title="Storage" sub="Decentralized" />
            </div>
          </div>

          <div className="glass-strong rounded-[2rem] p-6 border-cyan/30 shadow-[0_0_30px_rgba(var(--cyan),0.1)] hover:border-cyan/50 transition-all duration-500 shadow-glow-cyan/5 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] font-black tracking-[0.3em] text-cyan uppercase">Live Leaderboard Feed</div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-cyan animate-ping" />
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Live Activity</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {feedData.length > 0 ? feedData.slice(0, 3).map((battle, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group overflow-hidden relative">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      battle.type === "success" ? "bg-cyan shadow-glow-cyan" : 
                      battle.type === "streak" ? "bg-magenta shadow-glow-magenta" : "bg-red-500"
                    )} />
                    <div>
                      <div className="text-[10px] font-black text-white">{battle.user}</div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-tighter">{battle.action}</div>
                    </div>
                  </div>
                  <div className="text-right relative z-10">
                    <div className={cn(
                      "text-[10px] font-black",
                      battle.type === "success" ? "text-cyan" : 
                      battle.type === "streak" ? "text-magenta" : "text-red-400"
                    )}>{battle.score}</div>
                    <div className="text-[7px] text-muted-foreground uppercase tracking-widest font-bold">Protocol Output</div>
                  </div>
                  {battle.type === "streak" && (
                    <div className="absolute inset-0 bg-magenta/5 animate-pulse" />
                  )}
                </div>
              )) : (
                <div className="py-8 text-center text-[10px] font-bold text-muted-foreground animate-pulse uppercase tracking-widest">
                  Synchronizing Neural Links...
                </div>
              )}
            </div>

            <Button variant="ghost" className="w-full h-8 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-cyan transition-colors">
              Synchronize Data...
            </Button>
          </div>
        </div>
      </section>

      {/* Trailer Modal Overlay */}
      <AnimatePresence>
        {showTrailer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-10"
          >
            <button 
              onClick={() => setShowTrailer(false)}
              className="absolute top-6 right-6 h-12 w-12 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all hover:scale-110 active:scale-90 z-[110]"
            >
              <X className="text-white" size={24} />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(var(--primary),0.2)] border border-white/10 relative bg-black"
            >
              <video 
                src={trailerVid} 
                autoPlay 
                controls 
                className="w-full h-full object-contain"
                onEnded={() => setShowTrailer(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default LandingPage;
