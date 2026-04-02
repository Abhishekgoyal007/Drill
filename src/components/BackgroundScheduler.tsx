'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';

export function BackgroundScheduler() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const lastFiredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !profile || !profile.callTime) return;

    const checkTime = () => {
      // Don't fire if already in a call or post-call
      if (pathname === '/call' || pathname === '/post-call') return;

      const now = new Date();
      const currentH = now.getHours().toString().padStart(2, '0');
      const currentM = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentH}:${currentM}`;

      // Check if current time matches scheduled time
      if (currentTimeStr === profile.callTime && lastFiredRef.current !== currentTimeStr) {
        lastFiredRef.current = currentTimeStr;
        
        // Trigger the magic
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("It's Drill Time! 🥊", {
            body: `Hey ${profile.name.split(' ')[0]}, it's ${profile.callTime}. Time for your standup.`,
            icon: '/icons/icon-192.png',
            tag: 'drill-scheduled-call',
            requireInteraction: true
          });
        }

        // Auto-redirect to call
        router.push('/call');
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkTime, 30000);
    checkTime(); // Initial check

    return () => clearInterval(interval);
  }, [profile, user, pathname, router]);

  return null;
}
