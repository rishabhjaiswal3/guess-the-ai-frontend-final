import { Twitter, MessageSquare, Send } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-background border-t border-white/5 pt-16 pb-8 overflow-hidden z-10">
      {/* Background grid/mesh effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
        transform: 'perspective(500px) rotateX(60deg) scale(2) translateY(50px)'
      }}></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-3xl font-black italic tracking-wider mb-4" style={{ 
              color: '#00FFFF',
              textShadow: '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)'
            }}>
              GUESS THE AI
            </h3>
            <p className="text-sm text-foreground/70 mb-6 leading-relaxed">
              Analyze patterns, detect neural signatures, and prove you're smarter than the machines. Powered by Kult Games.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 rounded-full border border-magenta/40 flex items-center justify-center text-magenta hover:bg-magenta/10 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-magenta/40 flex items-center justify-center text-magenta hover:bg-magenta/10 transition-colors">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-magenta/40 flex items-center justify-center text-magenta hover:bg-magenta/10 transition-colors">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* GAME Column */}
          <div>
            <h4 className="text-sm font-bold tracking-[0.2em] mb-6">GAME</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Download</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Arenas</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Trailer</a></li>
            </ul>
          </div>

          {/* RESOURCES Column */}
          <div>
            <h4 className="text-sm font-bold tracking-[0.2em] mb-6">RESOURCES</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Game Manual</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Fight Brief</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Home</a></li>
            </ul>
          </div>

          {/* FOLLOW Column */}
          <div>
            <h4 className="text-sm font-bold tracking-[0.2em] mb-6">FOLLOW</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">X (Twitter)</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Discord</a></li>
              <li><a href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Telegram</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-foreground/50 tracking-wider">
            © 2026 Guess The AI - Protocol Active
          </p>
          <div className="flex items-center space-x-6">
            <div className="text-xl font-bold tracking-widest text-white/80">KULT <span className="text-xs align-top">GAMES</span></div>
            <div className="text-xl font-bold text-white/80">0G</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
