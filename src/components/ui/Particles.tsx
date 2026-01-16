import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  speedX: number;
  speedY: number;
}

interface ParticlesProps {
  count?: number;
  className?: string;
  interactive?: boolean;
  colors?: string[];
}

const defaultColors = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
];

export function Particles({ 
  count = 50, 
  className, 
  interactive = true,
  colors = defaultColors 
}: ParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: (Math.random() - 0.5) * 0.02 - 0.01,
      });
    }
    setParticles(newParticles);
  }, [count, colors]);

  // Interactive mouse tracking
  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime > 50) {
        setParticles(prev => prev.map(p => {
          let newX = p.x + p.speedX * 100;
          let newY = p.y + p.speedY * 100;

          // Wrap around
          if (newX < -5) newX = 105;
          if (newX > 105) newX = -5;
          if (newY < -5) newY = 105;
          if (newY > 105) newY = -5;

          return { ...p, x: newX, y: newY };
        }));
        lastTime = time;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particles.length]);

  if (particles.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full transition-transform duration-1000 ease-out"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
            animation: `particle-pulse ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      {/* Floating orbs */}
      <div 
        className="absolute w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-float"
        style={{ left: '10%', top: '20%' }}
      />
      <div 
        className="absolute w-40 h-40 rounded-full bg-secondary/10 blur-3xl animate-float"
        style={{ left: '80%', top: '60%', animationDelay: '2s' }}
      />
      <div 
        className="absolute w-24 h-24 rounded-full bg-accent/10 blur-3xl animate-float"
        style={{ left: '50%', top: '80%', animationDelay: '4s' }}
      />

      <style>{`
        @keyframes particle-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: var(--tw-bg-opacity, 0.5);
          }
          50% {
            transform: scale(1.5);
            opacity: calc(var(--tw-bg-opacity, 0.5) * 1.5);
          }
        }
      `}</style>
    </div>
  );
}
