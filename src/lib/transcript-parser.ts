/**
 * Transcript Parser
 * Extracts commitments, blockers, and a summary from standup conversation transcripts.
 * Uses keyword/phrase matching heuristics — can be swapped for LLM-based parsing later.
 */

interface ParsedStandup {
  summary: string;
  commitments: string[];
  blockers: string[];
}

// Commitment signal phrases
const COMMITMENT_SIGNALS = [
  /i(?:'ll| will| am going to| plan to| want to| need to| have to| gotta| gonna)\s+(.+?)(?:\.|$)/gi,
  /today(?:'s plan is to|,?\s*i(?:'ll| will))\s+(.+?)(?:\.|$)/gi,
  /my (?:plan|goal|target) (?:is|for today is) (?:to )?\s*(.+?)(?:\.|$)/gi,
  /going to (?:work on|finish|complete|ship|deploy|build|start|implement|fix|refactor|test|write)\s+(.+?)(?:\.|$)/gi,
  /(?:finish|complete|ship|deploy|build|start|implement|fix|refactor|test|write|push|merge|review)\s+(.+?)(?:\.|$)/gi,
];

// Blocker signal phrases
const BLOCKER_SIGNALS = [
  /(?:blocked|stuck|waiting|blocking|held up|can't proceed|can not proceed)\s+(?:on|by|for)\s+(.+?)(?:\.|$)/gi,
  /(?:the )?(?:issue|problem|blocker|challenge|difficulty|obstacle) (?:is|with)\s+(.+?)(?:\.|$)/gi,
  /(?:struggling|having trouble|having issues|running into problems?)\s+(?:with )?\s*(.+?)(?:\.|$)/gi,
  /(?:need help|need assistance|need support)\s+(?:with )?\s*(.+?)(?:\.|$)/gi,
  /(?:depends on|dependent on|waiting for)\s+(.+?)(?:\.|$)/gi,
];

// Words that indicate the user's speech (not the AI's)
const USER_PREFIX_PATTERN = /^(?!Drill:)/;

function cleanExtraction(text: string): string {
  return text
    .replace(/^(?:to|that|the)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deduplicateByOverlap(items: string[]): string[] {
  const result: string[] = [];
  for (const item of items) {
    const normalized = item.toLowerCase();
    const isDuplicate = result.some((existing) => {
      const existingNorm = existing.toLowerCase();
      return (
        existingNorm.includes(normalized) ||
        normalized.includes(existingNorm) ||
        similarity(existingNorm, normalized) > 0.7
      );
    });
    if (!isDuplicate && item.length > 3) {
      result.push(item);
    }
  }
  return result;
}

function similarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  return (2 * intersection.length) / (wordsA.size + wordsB.size);
}

/**
 * Extract user-only lines from the transcript.
 * Transcript format: "Speaker: message"
 */
function getUserLines(transcript: string, userName: string): string[] {
  return transcript
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      // Include lines from the user (not from Drill/AI)
      return (
        trimmed.startsWith(`${userName}:`) ||
        (!trimmed.startsWith('Drill:') && !trimmed.startsWith('AI:') && trimmed.length > 0)
      );
    })
    .map((line) => {
      // Remove speaker prefix
      const colonIndex = line.indexOf(':');
      return colonIndex > 0 ? line.slice(colonIndex + 1).trim() : line.trim();
    });
}

export function parseTranscript(transcript: string, userName: string = ''): ParsedStandup {
  const userLines = getUserLines(transcript, userName);
  const userText = userLines.join('. ');

  // Extract commitments
  const rawCommitments: string[] = [];
  for (const pattern of COMMITMENT_SIGNALS) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(userText)) !== null) {
      const extracted = cleanExtraction(match[1] || match[0]);
      if (extracted.length > 5 && extracted.length < 200) {
        rawCommitments.push(extracted.charAt(0).toUpperCase() + extracted.slice(1));
      }
    }
  }

  // Extract blockers
  const rawBlockers: string[] = [];
  for (const pattern of BLOCKER_SIGNALS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(userText)) !== null) {
      const extracted = cleanExtraction(match[1] || match[0]);
      if (extracted.length > 5 && extracted.length < 200) {
        rawBlockers.push(extracted.charAt(0).toUpperCase() + extracted.slice(1));
      }
    }
  }

  const commitments = deduplicateByOverlap(rawCommitments).slice(0, 5);
  const blockers = deduplicateByOverlap(rawBlockers).slice(0, 3);

  // Generate summary from user lines
  const summary = generateSummary(userLines, commitments, blockers);

  // Fallback if nothing was extracted
  if (commitments.length === 0 && userLines.length > 0) {
    // Take the most substantial user messages as implicit commitments
    const substantial = userLines
      .filter((l) => l.length > 15)
      .slice(0, 3)
      .map((l) => {
        const cleaned = l.replace(/^(so |well |yeah |um |uh |like )/i, '').trim();
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      });
    commitments.push(...substantial);
  }

  return { summary, commitments, blockers };
}

function generateSummary(
  userLines: string[],
  commitments: string[],
  blockers: string[]
): string {
  const parts: string[] = [];

  if (commitments.length > 0) {
    parts.push(`Planning to ${commitments.slice(0, 2).join(' and ').toLowerCase()}`);
  }

  if (blockers.length > 0) {
    parts.push(`Blocked by ${blockers[0].toLowerCase()}`);
  }

  if (parts.length === 0) {
    // Fallback: use the longest user message
    const longest = userLines.sort((a, b) => b.length - a.length)[0];
    if (longest) {
      return longest.length > 100 ? longest.slice(0, 100) + '...' : longest;
    }
    return 'Completed daily standup';
  }

  return parts.join('. ') + '.';
}
