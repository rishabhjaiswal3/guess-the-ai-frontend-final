import { useEffect, useRef } from "react";
import { useGraphicsSettings } from "@/hooks/useGraphicsSettings";

export default function NeuralGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { lowGraphics } = useGraphicsSettings();

  useEffect(() => {
    if (lowGraphics) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    
    // Nodes for the neural network
    const nodes: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
    const numNodes = 60; // Adjust for density
    
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Re-initialize nodes on resize to spread them out
      nodes.length = 0;
      for (let i = 0; i < numNodes; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 1.5 + 0.5,
        });
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = "rgba(139, 93, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      // Moving grid effect
      const offsetX = (Date.now() / 50) % gridSize;
      const offsetY = (Date.now() / 50) % gridSize;

      ctx.beginPath();
      for (let x = offsetX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Update and draw nodes
      ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
      
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce off walls
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.15 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }

      // Draw scanning line
      const scanY = (Date.now() / 15) % height;
      const gradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY);
      gradient.addColorStop(0, "rgba(0, 255, 255, 0)");
      gradient.addColorStop(0.8, "rgba(0, 255, 255, 0.05)");
      gradient.addColorStop(1, "rgba(0, 255, 255, 0.2)");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 50, width, 50);
      
      ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
      ctx.fillRect(0, scanY, width, 1);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [lowGraphics]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] opacity-60"
      style={{ background: "radial-gradient(circle at center, #0B0E17 0%, #05060A 100%)" }}
    />
  );
}
