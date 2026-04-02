'use client';

import { useEffect, useRef } from 'react';

interface WaveformProps {
  isActive: boolean;
  color?: 'blue' | 'green' | 'red';
  barCount?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const colorMap = {
  blue: '#4D9FFF',
  green: '#00FF94',
  red: '#FF3D3D',
};

const sizeMap = {
  sm: { height: 30, barWidth: 2, gap: 2 },
  md: { height: 60, barWidth: 3, gap: 3 },
  lg: { height: 120, barWidth: 4, gap: 3 },
  xl: { height: 200, barWidth: 5, gap: 4 },
};

export default function Waveform({
  isActive,
  color = 'blue',
  barCount = 40,
  size = 'lg',
  className = '',
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { height, barWidth, gap } = sizeMap[size];
    const totalWidth = barCount * (barWidth + gap);
    
    canvas.width = totalWidth * 2; // For retina
    canvas.height = height * 2;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);

    // Initialize bars
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: barCount }, () => Math.random() * 0.3 + 0.1);
    }

    const baseColor = colorMap[color];

    function animate() {
      if (!ctx || !canvas) return;
      const { height: h, barWidth: bw, gap: g } = sizeMap[size];
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < barCount; i++) {
        if (isActive) {
          // Smooth random movement when active
          const target = Math.random() * 0.8 + 0.2;
          barsRef.current[i] += (target - barsRef.current[i]) * 0.15;
        } else {
          // Gentle breathing when inactive
          const time = Date.now() / 1000;
          const target = Math.sin(time * 0.5 + i * 0.3) * 0.15 + 0.2;
          barsRef.current[i] += (target - barsRef.current[i]) * 0.05;
        }

        const barHeight = barsRef.current[i] * h;
        const x = i * (bw + g);
        const y = (h - barHeight) / 2;

        // Gradient for each bar
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, baseColor + '40');
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(1, baseColor + '40');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, barHeight, bw / 2);
        ctx.fill();

        // Glow effect when active
        if (isActive && barsRef.current[i] > 0.6) {
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, color, barCount, size]);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}
