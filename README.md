# 🔩 Drill — The Scrum Master That Never Lets You Off The Hook

> _"Your scrum master doesn't take excuses."_

**Drill** is a voice-first AI scrum master that calls you every morning, remembers everything you said, detects your patterns, and calls out your BS. No typing. No excuses. Just results.

Built for **ElevenHacks × Cloudflare**.

---

## ✨ Features

### 🎙️ Voice-First Standups
Speak your standup naturally. Real-time AI conversation powered by [ElevenLabs](https://elevenlabs.io) Conversational AI. No forms, no typing — just talk.

### 🧠 Pattern Detection
Stuck on the same blocker for 3 days? Drill will call it out. The app automatically detects repeated blockers, missed commitments, and avoidance patterns with severity ratings.

### 🔥 Streak Tracking
GitHub-style heatmap visualization of your standup history. Track your current streak, longest streak, and delivery rate over time.

### 📊 Accountability Loop
Every standup captures your commitments. The next day, Drill checks — did you actually deliver? Your delivery rate is tracked and displayed prominently.

### 💀 Brutal Honesty
Drill doesn't sugarcoat. Post-call quotes and pattern alerts are designed to push you, not comfort you.

---

## 🖥️ Pages

| Page | Description |
|------|-------------|
| `/` | Landing page with hero, waveform animation, and feature cards |
| `/onboarding` | 3-step setup: identity → project context → schedule |
| `/call` | Voice call interface with real-time waveform, topic tracking, mute/unmute |
| `/post-call` | Call summary, yesterday's accountability check, Twitter sharing |
| `/dashboard` | Streak stats, delivery rate, pattern alerts, heatmap, standup history |
| `/settings` | Edit profile, project, schedule, view stats, delete account |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/drill.git
cd drill

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your ElevenLabs Agent ID
```

### Environment Variables

```env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
```

> **Note:** The app works in demo mode without an ElevenLabs agent. It simulates a full standup conversation so you can explore all features.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [TypeScript](https://typescriptlang.org) | Type-safe development |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling |
| [Framer Motion](https://framer.com/motion) | Animations and transitions |
| [ElevenLabs](https://elevenlabs.io) | Conversational AI voice agent |
| [Lucide React](https://lucide.dev) | Icon library |
| localStorage | Client-side persistence |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Design system & animations
│   ├── call/page.tsx       # Voice call interface
│   ├── dashboard/page.tsx  # Stats & history dashboard
│   ├── onboarding/page.tsx # User onboarding flow
│   ├── post-call/page.tsx  # Post-call summary & accountability
│   └── settings/page.tsx   # User settings
├── components/
│   ├── Waveform.tsx        # Canvas-based audio waveform
│   └── Heatmap.tsx         # GitHub-style activity grid
└── lib/
    ├── store.ts            # localStorage state management
    ├── types.ts            # TypeScript interfaces
    └── transcript-parser.ts # Extract commitments/blockers from transcripts
```

---

## 🎨 Design

- **Dark theme** with `#0A0A0A` base, glass-morphic cards, and subtle grid overlays
- **Color palette**: Blue (`#4D9FFF`), Green (`#00FF94`), Red (`#FF3D3D`)
- **Animations**: Breathing waveforms, pulsing glows, spring-based heatmap cells, slide transitions
- **Typography**: Inter font family with Geist Mono for code/timers

---

## 🤖 ElevenLabs Agent Setup

To use real voice conversations:

1. Create a [Conversational AI agent](https://elevenlabs.io/conversational-ai) on ElevenLabs
2. Use this system prompt for the agent:

```
You are Drill, a no-nonsense AI scrum master. You're direct, intense, and accountability-focused.

Your job is to run a daily standup in this order:
1. Ask what they shipped/completed yesterday
2. If their answer is vague, push for specifics
3. Ask what they plan to do today
4. Ask about any blockers
5. Summarize their commitments and remind them you'll check tomorrow

Rules:
- Keep responses SHORT (1-2 sentences max)
- Be direct, not mean — think tough coach, not bully
- Call out vague answers immediately
- Reference their project context when relevant
- End the call after the summary — don't drag it out
```

3. Copy the Agent ID and add it to your `.env.local`

---

## 📄 License

MIT

---

Built with 🔥 for developers who are done lying to themselves.
