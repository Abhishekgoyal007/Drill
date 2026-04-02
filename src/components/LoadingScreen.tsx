'use client';

import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center">
          <span className="text-white font-black text-base">D</span>
        </div>
      </motion.div>

      {/* Loading dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#4D9FFF]"
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-[#555]"
      >
        {message}
      </motion.p>
    </div>
  );
}
