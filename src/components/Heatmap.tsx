'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeatmapProps {
  data: Record<string, boolean>;
  className?: string;
}

export default function Heatmap({ data, className = '' }: HeatmapProps) {
  const weeks = useMemo(() => {
    const result: { date: string; completed: boolean; dayOfWeek: number }[][] = [];
    const today = new Date();
    
    // Go back 12 weeks
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83);
    
    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    let currentWeek: { date: string; completed: boolean; dayOfWeek: number }[] = [];
    const current = new Date(startDate);
    
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      currentWeek.push({
        date: dateStr,
        completed: data[dateStr] || false,
        dayOfWeek: current.getDay(),
      });
      
      if (current.getDay() === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    
    return result;
  }, [data]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className={`${className}`}>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-2 text-[10px] text-text-secondary">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[14px] flex items-center justify-end w-6">
              {label}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const day = week.find(d => d.dayOfWeek === dayIndex);
                if (!day) {
                  return <div key={dayIndex} className="w-[14px] h-[14px]" />;
                }
                
                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: (weekIndex * 7 + dayIndex) * 0.008,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="heatmap-cell relative group"
                    style={{
                      background: day.completed
                        ? '#00FF94'
                        : new Date(day.date) > new Date()
                        ? 'transparent'
                        : 'rgba(255, 255, 255, 0.04)',
                      opacity: day.completed ? 1 : 0.6,
                      boxShadow: day.completed
                        ? '0 0 6px rgba(0, 255, 148, 0.3)'
                        : 'none',
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#222] rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      {day.date}
                      <br />
                      {day.completed ? '✅ Completed' : '❌ Missed'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[11px] text-text-secondary">
        <span>Less</span>
        <div className="w-[12px] h-[12px] rounded-[2px]" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="w-[12px] h-[12px] rounded-[2px]" style={{ background: 'rgba(0, 255, 148, 0.3)' }} />
        <div className="w-[12px] h-[12px] rounded-[2px]" style={{ background: 'rgba(0, 255, 148, 0.6)' }} />
        <div className="w-[12px] h-[12px] rounded-[2px]" style={{ background: '#00FF94' }} />
        <span>More</span>
      </div>
    </div>
  );
}
