'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Mic, Brain, TrendingUp, Zap, Shield, Clock, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Waveform from '@/components/Waveform';
import { useAuth } from '@/lib/auth-context';

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 3 === 0 ? '#4D9FFF' : i % 3 === 1 ? '#00FF94' : '#FF3D3D',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function MockupPreview() {
  const [activeMessage, setActiveMessage] = useState(0);
  const messages = [
    { speaker: 'Drill', text: "Hey, it's Drill. Day 12. What did you get done yesterday?", side: 'left' },
    { speaker: 'You', text: "I finished 3 chapters and hit the gym.", side: 'right' },
    { speaker: 'Drill', text: "Good. What about the resume you said you'd update?", side: 'left' },
    { speaker: 'You', text: "I didn't get to it, I'll do it today.", side: 'right' },
    { speaker: 'Drill', text: "That's the third time. While you're postponing, someone else already applied.", side: 'left' },
    { speaker: 'You', text: "You're right. I'll finish it by 6pm today.", side: 'right' },
    { speaker: 'Drill', text: "By 6pm. I'm holding you to that. What else are you doing today?", side: 'left' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessage((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateY: -5 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: 0.8, duration: 0.8, type: 'spring' }}
      className="relative w-full max-w-sm"
      style={{ perspective: '1000px' }}
    >
      {/* Phone frame */}
      <div className="relative rounded-[2rem] border border-[rgba(255,255,255,0.1)] bg-[#0D0D0D] p-2 shadow-2xl shadow-[rgba(77,159,255,0.1)]">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0D0D0D] rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="rounded-[1.5rem] bg-[#0A0A0A] overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-8 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center">
                <span className="text-white font-black text-[8px]">D</span>
              </div>
              <span className="text-white font-semibold text-xs">Drill</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF3D3D] animate-pulse" />
              <span className="text-white font-mono text-[10px]">02:34</span>
            </div>
          </div>

          {/* Topic pill */}
          <div className="flex justify-center py-2">
            <div className="px-3 py-1 rounded-full bg-[rgba(77,159,255,0.1)] border border-[rgba(77,159,255,0.2)]">
              <span className="text-[10px] text-[#4D9FFF] font-medium">
                {activeMessage < 2 ? "Yesterday's work" : activeMessage < 4 ? "Today's plan" : "Blockers"}
              </span>
            </div>
          </div>

          {/* Mini waveform */}
          <div className="flex justify-center py-4">
            <div className="flex items-end gap-[2px] h-12">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[2px] rounded-full"
                  style={{
                    background: messages[activeMessage]?.side === 'left' ? '#4D9FFF' : '#00FF94',
                  }}
                  animate={{
                    height: [4, Math.random() * 28 + 8, 4],
                  }}
                  transition={{
                    duration: 0.8 + Math.random() * 0.4,
                    repeat: Infinity,
                    delay: i * 0.03,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="px-4 pb-4 space-y-2 min-h-[180px]">
            {messages.slice(0, activeMessage + 1).slice(-4).map((msg, i) => (
              <motion.div
                key={`${activeMessage}-${i}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.side === 'right' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-[10px] leading-relaxed ${
                    msg.side === 'right'
                      ? 'bg-[rgba(0,255,148,0.1)] text-[#ccc] rounded-br-sm'
                      : 'bg-[rgba(77,159,255,0.1)] text-[#ccc] rounded-bl-sm'
                  }`}
                >
                  <span className={`font-semibold block text-[8px] mb-0.5 ${
                    msg.side === 'right' ? 'text-[#00FF94]' : 'text-[#4D9FFF]'
                  }`}>
                    {msg.speaker}
                  </span>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-center gap-4 pb-6 pt-2">
            <div className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-[#888]" />
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FF3D3D] flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 rounded-sm bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Glow behind phone */}
      <div className="absolute -inset-8 -z-10 rounded-full blur-3xl bg-gradient-to-br from-[rgba(77,159,255,0.15)] to-[rgba(0,255,148,0.08)]" />
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { user, profile, loading, signInWithGoogle } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.onboarded) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [loading, user, profile, router]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setSigningIn(false);
    }
  };

  if (!mounted || loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      <FloatingParticles />

      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] bg-[rgba(77,159,255,0.06)] animate-breathe" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] bg-[rgba(0,255,148,0.04)] animate-breathe" style={{ animationDelay: '2s' }} />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-20 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center shadow-lg shadow-[rgba(77,159,255,0.25)]">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Drill</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-[#888] hover:text-white transition-colors hidden md:block">Features</a>
          <a href="#how-it-works" className="text-sm text-[#888] hover:text-white transition-colors hidden md:block">How it Works</a>
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="text-sm text-white px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
          >
            {signingIn ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </motion.nav>

      {/* Hero — Split Layout */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-24"
      >
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          {/* Left — Copy */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-[rgba(77,159,255,0.2)] bg-[rgba(77,159,255,0.05)]"
            >
              <div className="w-2 h-2 rounded-full bg-[#00FF94] animate-pulse" />
              <span className="text-sm text-[#4D9FFF] font-medium">
                AI-Powered Daily Accountability
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6"
            >
              <span className="text-white">Your AI partner</span>
              <br />
              <span className="bg-gradient-to-r from-[#4D9FFF] via-[#00C2FF] to-[#00FF94] bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                that won&apos;t let
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#FF3D3D] via-[#FF6B4D] to-[#FF3D3D] bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]" style={{ animationDelay: '1s' }}>
                you slack off.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-[#888] max-w-lg mb-8 leading-relaxed mx-auto lg:mx-0"
            >
              Drill calls you every day. You tell it what you did and what you&apos;ll do next. 
              It remembers everything, tracks your patterns, and holds you 
              accountable. No typing. No excuses. Just results.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="group relative px-8 py-4 bg-gradient-to-r from-[#4D9FFF] to-[#0066FF] rounded-2xl text-base font-bold text-white overflow-hidden shadow-lg shadow-[rgba(77,159,255,0.3)] hover:shadow-[rgba(77,159,255,0.5)] transition-shadow disabled:opacity-50"
                id="start-streak-button"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {signingIn ? 'Signing in...' : 'Start for Free'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0066FF] to-[#4D9FFF] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 text-sm text-[#888] hover:text-white transition-colors"
              >
                See how it works
                <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-4 mt-8 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {['#4D9FFF', '#00FF94', '#FF3D3D', '#FFD700'].map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: color }}
                  >
                    {['A', 'K', 'M', 'R'][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#555]">
                For people who do, not just plan.
              </p>
            </motion.div>
          </div>

          {/* Right — Live Mockup */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <MockupPreview />
          </div>
        </div>
      </motion.section>

      {/* Tech strip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 border-y border-[rgba(255,255,255,0.04)] py-6 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-center gap-8 flex-wrap">
          <span className="text-xs text-[#555] uppercase tracking-wider font-medium">Powered by</span>
          {[
            { name: 'ElevenLabs', color: '#4D9FFF' },
            { name: 'Cloudflare', color: '#F6821F' },
            { name: 'Next.js', color: '#fff' },
            { name: 'Firebase', color: '#FFCA28' },
            { name: 'Framer Motion', color: '#FF0080' },
          ].map((tech) => (
            <div key={tech.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: tech.color }} />
              <span className="text-xs font-medium" style={{ color: tech.color }}>
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm text-[#4D9FFF] font-medium uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-5xl font-black text-white mt-3">
            Everything you need to <span className="text-[#00FF94]">actually get things done</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Mic className="w-6 h-6" />,
              title: 'Voice-First Check-ins',
              description: 'Real-time AI conversation powered by ElevenLabs. Just talk — no typing needed.',
              color: '#4D9FFF',
              gradient: 'from-[rgba(77,159,255,0.15)] to-transparent',
            },
            {
              icon: <Brain className="w-6 h-6" />,
              title: 'Pattern Detection',
              description: 'Postponing the same task again? Drill detects it and pushes you. Others are getting ahead.',
              color: '#FF3D3D',
              gradient: 'from-[rgba(255,61,61,0.15)] to-transparent',
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: 'Accountability Loop',
              description: 'Every day, Drill checks: did you do what you said? Your delivery rate tells the truth.',
              color: '#00FF94',
              gradient: 'from-[rgba(0,255,148,0.15)] to-transparent',
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: 'Streak Tracking',
              description: 'See your consistency with a heatmap. Break the chain and Drill notices.',
              color: '#FFD700',
              gradient: 'from-[rgba(255,215,0,0.15)] to-transparent',
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: 'Persistent Memory',
              description: 'Drill remembers everything. Your tasks, patterns, and commitments persist across devices.',
              color: '#4D9FFF',
              gradient: 'from-[rgba(77,159,255,0.15)] to-transparent',
            },
            {
              icon: <Clock className="w-6 h-6" />,
              title: '90-Second Check-ins',
              description: 'No rambling. Say what you did, what you\'ll do, and what\'s blocking you. Done.',
              color: '#FF6B4D',
              gradient: 'from-[rgba(255,107,77,0.15)] to-transparent',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                y: -8, 
                transition: { duration: 0.2 },
                boxShadow: `0 20px 40px -20px ${feature.color}40`,
                borderColor: `${feature.color}40`
              }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group glass-card p-6 transition-all duration-300 relative overflow-hidden cursor-default"
            >
              {/* Hover gradient */}
              <div
                className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <div className="relative z-10">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
                  style={{
                    background: `${feature.color}15`,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm text-[#FF3D3D] font-medium uppercase tracking-wider">How it works</span>
          <h2 className="text-3xl md:text-5xl font-black text-white mt-3">
            Three steps. <span className="text-[#FF3D3D]">Zero excuses.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Drill Checks In',
              description: 'Every day at your chosen time. A voice call starts. No snooze button.',
              color: '#4D9FFF',
              emoji: '📞',
            },
            {
              step: '02',
              title: 'You Report',
              description: 'What you did. What you\'ll do next. What\'s in the way. Drill listens and pushes.',
              color: '#00FF94',
              emoji: '🎙️',
            },
            {
              step: '03',
              title: 'Drill Remembers',
              description: 'Tomorrow, Drill checks. Did you deliver? Patterns detected. No hiding.',
              color: '#FF3D3D',
              emoji: '🧠',
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-12 right-0 w-full h-[1px] bg-gradient-to-r from-[rgba(255,255,255,0.1)] to-transparent translate-x-1/2 z-0" />
              )}
              <div className="relative z-10 glass-card p-8 text-center">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: item.color }}
                >
                  Step {item.step}
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
            Stop postponing.
            <br />
            <span className="bg-gradient-to-r from-[#4D9FFF] to-[#00FF94] bg-clip-text text-transparent">
              Start delivering.
            </span>
          </h2>
          <p className="text-[#888] text-lg mb-10 max-w-2xl mx-auto">
            The people who win don&apos;t need motivation. They need accountability. 
            Drill is the voice that won&apos;t let you off the hook.
          </p>
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="group relative px-10 py-5 bg-gradient-to-r from-[#4D9FFF] to-[#00FF94] rounded-2xl text-lg font-bold text-black overflow-hidden shadow-lg shadow-[rgba(0,255,148,0.2)] hover:shadow-[rgba(0,255,148,0.4)] transition-all hover:scale-105 disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center gap-3">
              {signingIn ? 'Signing in...' : 'Start Your Streak — Free'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.06)] py-8">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4D9FFF] to-[#0066FF] flex items-center justify-center">
              <span className="text-white font-black text-[10px]">D</span>
            </div>
            <span className="text-sm text-[#555]">
              Built with 🔥 for ElevenHacks × Cloudflare
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com" className="text-xs text-[#555] hover:text-white transition-colors">GitHub</a>
            <a href="https://twitter.com" className="text-xs text-[#555] hover:text-white transition-colors">Twitter</a>
            <span className="text-xs text-[#333]">© 2026 Drill</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
