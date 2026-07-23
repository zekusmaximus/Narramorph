/**
 * Notice tray (Accession) — one filing tray for every transient reader signal.
 *
 * Replaces the three divergent notice systems (unlock toasts, persistence banners,
 * revisit hint) with a single bottom-right tray that shows ONE record-sheet "slip"
 * at a time plus a "+N FILED" queue counter. Simultaneous unlocks coalesce into one
 * slip. Severity drives ordering (error > warning > info); newer preempts older
 * within a severity, and nothing is ever dropped — it files behind the counter.
 *
 * Anatomy is shared with the dialog family: square corners, mono classification
 * line, serif title, hairline rules, and a 2px left severity rule (perspective ink
 * for unlocks, #e8d9b8 for warnings, #E74C3C for errors, #3b4a54 neutral). No neon
 * borders, no glow, no icon-in-tinted-circle. Max map coverage ≈ 300×150px.
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { hasSeenRevisitHint, markRevisitHintSeen } from '@/components/NodeMap/revisitHintStorage';
import { useJourneySaveFile } from '@/hooks/useJourneySaveFile';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { useStoryStore } from '@/stores/storyStore';
import type { CharacterType } from '@/types';
import { downloadTextFile } from '@/utils/journeyDownload';

type Severity = 'error' | 'warning' | 'info';

const SEVERITY_RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** Neutral severity rule for non-perspective, non-warning notices. */
const RULE_NEUTRAL = '#3b4a54';
/** Warning rule — the essential-thread sand accent. */
const RULE_WARNING = '#e8d9b8';

const PERSPECTIVE: Record<CharacterType, { tag: string; ink: string }> = {
  archaeologist: { tag: 'ARCH', ink: '#7db2ec' },
  algorithm: { tag: 'ALGO', ink: '#50C878' },
  'last-human': { tag: 'HUM', ink: '#E74C3C' },
  'multi-perspective': { tag: 'CONV', ink: '#b07cc9' },
};

interface Slip {
  id: string;
  severity: Severity;
  /** Left severity rule colour. */
  rule: string;
  /** Mono classification line, e.g. `PASSAGE SURFACED · L3`. */
  classification: string;
  /** Optional serif title. */
  title?: string;
  titleInk?: string;
  body?: ReactNode;
  tags?: readonly { label: string; ink: string }[];
  primary?: { label: string; onClick: () => void };
  /** Whether to render an explicit "Dismiss" link (used by no-auto notices). */
  showDismissLink?: boolean;
  /** Close/dismiss handler (X, timeout, or the Dismiss link all call this). */
  onClose: () => void;
  /** Auto-dismiss delay in ms; omit to never auto-dismiss. */
  autoMs?: number;
  /** Optional stable test hook (e.g. per-node unlock id for e2e). */
  testId?: string;
}

const CLASSIFICATION = 'font-mono text-[10px] font-medium tracking-[0.14em] text-[#8fa3ad]';

/**
 * Single record-sheet slip. Presentation only — all behaviour is lifted to the tray.
 */
function NoticeSlip({ slip }: { slip: Slip }): ReactElement {
  return (
    <div
      className="border border-[#2b3b44] bg-[#0d1318]"
      style={{ borderLeft: `2px solid ${slip.rule}` }}
      data-testid={slip.testId}
    >
      <div className="flex items-baseline justify-between border-b border-[#1d2b33] px-3.5 pb-[7px] pt-[9px]">
        <span className={CLASSIFICATION}>{slip.classification}</span>
        <button
          type="button"
          onClick={slip.onClose}
          aria-label="Dismiss notice"
          className="relative -my-2 -mr-1 flex items-center justify-center px-1 text-[13px] leading-none text-[#8fa3ad] transition-colors after:absolute after:-inset-2 after:content-[''] hover:text-[#eef4f6]"
        >
          ×
        </button>
      </div>
      <div className="px-3.5 pb-3 pt-2.5">
        {slip.title && (
          <div
            className="font-serif text-sm font-semibold"
            style={{ color: slip.titleInk ?? '#eef4f6' }}
          >
            {slip.title}
          </div>
        )}
        {slip.body && (
          <p className="mt-1 text-[12.5px] leading-[1.55] text-[#dfe8ec]">{slip.body}</p>
        )}
        {slip.tags && slip.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {slip.tags.map((tag) => (
              <span
                key={tag.label}
                className="border px-[7px] py-[3px] font-mono text-[10px] font-medium"
                style={{ color: tag.ink, borderColor: `${tag.ink}80` }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
        {(slip.primary || slip.showDismissLink) && (
          <div className="mt-2.5 flex items-center gap-3.5 border-t border-[#1d2b33] pt-[9px]">
            {slip.primary && (
              <button
                type="button"
                onClick={slip.primary.onClick}
                className="min-h-9 text-xs font-medium tracking-[0.02em] text-[#a5f3fc] transition-colors hover:text-[#e0fbff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5f3fc]"
              >
                {slip.primary.label} →
              </button>
            )}
            {slip.showDismissLink && (
              <button
                type="button"
                onClick={slip.onClose}
                className="self-center text-xs text-[#93a5ae] underline decoration-dotted underline-offset-[3px] transition-colors hover:text-[#eef4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5f3fc]"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The one tray. Mounted once (in Home). Hidden while a passage is open; timers
 * freeze there and everything re-presents on return to the map.
 */
export function NoticeTray(): ReactElement | null {
  const recentlyUnlockedNodes = useStoryStore((state) => state.recentlyUnlockedNodes);
  const clearUnlockNotifications = useStoryStore((state) => state.clearUnlockNotifications);
  const nodes = useStoryStore((state) => state.nodes);
  const unlockConfigs = useStoryStore((state) => state.unlockConfigs);
  const storyViewOpen = useStoryStore((state) => state.storyViewOpen);
  const l3AssemblyViewOpen = useStoryStore((state) => state.l3AssemblyViewOpen);
  const selectNode = useStoryStore((state) => state.selectNode);
  const openStoryView = useStoryStore((state) => state.openStoryView);

  const lastSaveFailed = useStoryStore((state) => state.lastSaveFailed);
  const corruptSaveQuarantined = useStoryStore((state) => state.corruptSaveQuarantined);
  const migrationCount = useStoryStore((state) => state.lastLoadMigrations.length);
  const readQuarantinedSave = useStoryStore((state) => state.readQuarantinedSave);
  const dismissCorruptSaveNotice = useStoryStore((state) => state.dismissCorruptSaveNotice);
  const dismissSaveFailureNotice = useStoryStore((state) => state.dismissSaveFailureNotice);
  const dismissMigrationNotice = useStoryStore((state) => state.dismissMigrationNotice);
  const hasOpenedPassage = useStoryStore(
    (state) => Object.keys(state.progress.visitedNodes).length > 0,
  );

  const { exportSaveFile } = useJourneySaveFile();
  const reduceMotion = useReducedMotionPreference();

  const panelOpen = storyViewOpen || l3AssemblyViewOpen;

  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(() => hasSeenRevisitHint());

  const dismissHint = useCallback(() => {
    markRevisitHintSeen();
    setHintDismissed(true);
  }, []);

  const downloadUnreadable = useCallback(() => {
    const raw = readQuarantinedSave();
    if (raw !== null) {
      downloadTextFile('narramorph-unreadable-save.txt', 'text/plain', raw);
    }
  }, [readQuarantinedSave]);

  const openUnlockedNode = useCallback(
    (nodeId: string) => {
      selectNode(nodeId);
      openStoryView(nodeId);
    },
    [openStoryView, selectNode],
  );

  // Build the current slip set from live state, ordered by severity then recency.
  const slips = useMemo<Slip[]>(() => {
    const list: Slip[] = [];

    // Warnings (persistent — never auto-dismiss).
    if (lastSaveFailed) {
      list.push({
        id: 'save-failure',
        severity: 'warning',
        rule: RULE_WARNING,
        classification: 'SAVING PROBLEM',
        body: 'Your progress may not be saving on this device — storage could be full. Export a save file to keep your journey safe.',
        primary: { label: 'Export a save file', onClick: exportSaveFile },
        showDismissLink: true,
        onClose: dismissSaveFailureNotice,
      });
    }
    if (corruptSaveQuarantined) {
      list.push({
        id: 'quarantine',
        severity: 'warning',
        rule: RULE_WARNING,
        classification: 'SAVE RECOVERY',
        body: 'We couldn’t read your previous save on this device, so we set it aside and started fresh. You can download the unreadable data to keep or inspect it.',
        primary: { label: 'Download the unreadable data', onClick: downloadUnreadable },
        showDismissLink: true,
        onClose: dismissCorruptSaveNotice,
      });
    }

    // Unlocks (info) — coalesce simultaneous unlocks into one slip.
    const unlocked = recentlyUnlockedNodes
      .map((id) => nodes.get(id))
      .filter((node): node is NonNullable<typeof node> => node !== undefined);
    const [firstUnlocked] = unlocked;
    if (unlocked.length === 1 && firstUnlocked) {
      const node = firstUnlocked;
      const persp = PERSPECTIVE[node.character];
      const config = unlockConfigs.get(node.id);
      list.push({
        id: 'unlock',
        severity: 'info',
        rule: persp.ink,
        classification: `PASSAGE SURFACED · L${node.layer}`,
        title: node.title,
        titleInk: persp.ink,
        body: config?.unlockMessage,
        primary: { label: 'Open the passage', onClick: () => openUnlockedNode(node.id) },
        onClose: clearUnlockNotifications,
        autoMs: 8000,
        testId: `unlock-notification-${node.id}`,
      });
    } else if (unlocked.length > 1) {
      const distinct = [...new Set(unlocked.map((node) => node.character))];
      const allConvergence = unlocked.every((node) => node.character === 'multi-perspective');
      const layer = Math.max(...unlocked.map((node) => node.layer));
      const [soleCharacter] = distinct;
      const rule =
        distinct.length === 1 && soleCharacter ? PERSPECTIVE[soleCharacter].ink : '#b07cc9';
      list.push({
        id: 'unlock',
        severity: 'info',
        rule,
        classification: `PASSAGES SURFACED · L${layer}`,
        title: allConvergence
          ? `${unlocked.length} convergences unlocked`
          : `${unlocked.length} passages surfaced`,
        body: 'New passages are on the map — your path has the depth to surface them.',
        tags: distinct.map((character) => ({
          label: PERSPECTIVE[character].tag,
          ink: PERSPECTIVE[character].ink,
        })),
        primary: {
          label: 'Show on map',
          onClick: () => {
            const first = unlocked[0];
            if (first) {
              selectNode(first.id);
            }
          },
        },
        onClose: clearUnlockNotifications,
        autoMs: 8000,
      });
    }

    // Migration + revisit hint (info, 10s).
    if (migrationCount > 0) {
      list.push({
        id: 'migration',
        severity: 'info',
        rule: RULE_NEUTRAL,
        classification: 'SAVE UPDATED',
        body: 'We updated your save from an earlier version of the story.',
        onClose: dismissMigrationNotice,
        autoMs: 10000,
      });
    }
    if (!hintDismissed && hasOpenedPassage) {
      list.push({
        id: 'revisit-hint',
        severity: 'info',
        rule: RULE_NEUTRAL,
        classification: 'THE ARCHIVE REMEMBERS',
        body: 'Reopen a passage you’ve read and it may have changed.',
        onClose: dismissHint,
        autoMs: 10000,
      });
    }

    return list.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  }, [
    clearUnlockNotifications,
    corruptSaveQuarantined,
    dismissCorruptSaveNotice,
    dismissHint,
    dismissMigrationNotice,
    dismissSaveFailureNotice,
    downloadUnreadable,
    exportSaveFile,
    hasOpenedPassage,
    hintDismissed,
    lastSaveFailed,
    migrationCount,
    nodes,
    openUnlockedNode,
    recentlyUnlockedNodes,
    selectNode,
    unlockConfigs,
  ]);

  const front = slips[0];
  const filedCount = Math.max(0, slips.length - 1);

  // Per-slip auto-dismiss for the visible slip. Pauses on hover/focus, while the
  // queue is expanded, and while a passage is open (timers freeze).
  useEffect(() => {
    if (!front || panelOpen || paused || expanded || front.autoMs === undefined) {
      return undefined;
    }
    const timer = setTimeout(front.onClose, front.autoMs);
    return () => clearTimeout(timer);
  }, [expanded, front, panelOpen, paused]);

  // Collapse the expanded queue on Escape.
  useEffect(() => {
    if (!expanded) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  // Nothing to show, or fold away while reading.
  if (!front) {
    return null;
  }

  const announcement = `${front.title ?? front.classification}.${
    filedCount > 0 ? ` And ${filedCount} more ${filedCount === 1 ? 'notice' : 'notices'}.` : ''
  }`;

  const enter = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 };
  const settle = { opacity: 1, y: 0 };
  const leave = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 };

  return (
    <div
      className={`pointer-events-none fixed bottom-3 z-40 inset-x-3 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[300px] ${
        panelOpen ? 'invisible' : ''
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      data-testid="notice-tray"
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {panelOpen ? '' : announcement}
      </p>

      {filedCount > 0 && (
        <div className="pointer-events-auto mb-1.5 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="border border-[#2b3b44] bg-[#0d1318] px-2 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-[#8fa3ad] transition-colors hover:text-[#eef4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5f3fc]"
          >
            +{filedCount} FILED {expanded ? '▾' : '▸'}
          </button>
        </div>
      )}

      {expanded ? (
        <div className="pointer-events-auto flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto">
          {slips.map((slip) => (
            <NoticeSlip key={slip.id} slip={slip} />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={front.id}
            className="pointer-events-auto"
            initial={enter}
            animate={settle}
            exit={leave}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          >
            <NoticeSlip slip={front} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
