import { motion } from 'framer-motion';
import { Check, Moon, Settings, Sun, X } from 'lucide-react';
import { useCallback, useRef, type ReactElement } from 'react';

import { useDialogFocus } from '@/hooks/useDialogFocus';
import type { LineHeight, TextSize, Theme, UserPreferences } from '@/types';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (preferences: Partial<UserPreferences>) => void;
  reduceMotion: boolean;
}

const TEXT_SIZE_OPTIONS: ReadonlyArray<{
  value: TextSize;
  label: string;
  sampleClass: string;
}> = [
  { value: 'small', label: 'Compact', sampleClass: 'text-sm' },
  { value: 'medium', label: 'Comfortable', sampleClass: 'text-base' },
  { value: 'large', label: 'Large', sampleClass: 'text-lg' },
];

const THEME_OPTIONS: ReadonlyArray<{
  value: Theme;
  label: string;
  description: string;
}> = [
  { value: 'light', label: 'Paper', description: 'Clear ink on a pale page' },
  { value: 'dark', label: 'Night', description: 'Low-light archive surface' },
  { value: 'sepia', label: 'Archive', description: 'Warm, weathered paper' },
];

const LINE_HEIGHT_OPTIONS: ReadonlyArray<{
  value: LineHeight;
  label: string;
  sampleClass: string;
}> = [
  { value: 'cozy', label: 'Cozy', sampleClass: 'leading-[1.3]' },
  { value: 'normal', label: 'Normal', sampleClass: 'leading-[1.6]' },
  { value: 'relaxed', label: 'Airy', sampleClass: 'leading-[2]' },
];

export function SettingsDialog({
  open,
  onClose,
  preferences,
  onUpdatePreferences,
  reduceMotion,
}: SettingsDialogProps): ReactElement | null {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const handleClose = useCallback(() => onCloseRef.current(), []);
  const dialogRef = useDialogFocus(open, handleClose, {
    initialFocusSelector: '#settings-title',
  });

  if (!open) {
    return null;
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={handleClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        initial={reduceMotion ? false : { scale: 0.97, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={reduceMotion ? undefined : { scale: 0.97, opacity: 0, y: 8 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-cyan-200/20 bg-[#0b1015] p-4 text-slate-200 shadow-2xl shadow-black/60 sm:max-h-[calc(100dvh-3rem)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/[0.05] text-cyan-200 sm:flex">
              <Settings className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="break-words text-[0.65rem] uppercase tracking-[0.22em] text-cyan-200/60 [overflow-wrap:anywhere]">
                Reader preferences
              </p>
              <h2
                id="settings-title"
                tabIndex={-1}
                className="break-words font-serif text-2xl font-semibold text-slate-100 [overflow-wrap:anywhere]"
              >
                Shape the reading room
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-cyan-100 focus-visible:outline-cyan-200"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          <fieldset>
            <legend className="font-serif text-lg font-medium text-slate-100">Text size</legend>
            <p className="mt-1 text-sm text-slate-500">
              Choose a comfortable scale for long passages.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TEXT_SIZE_OPTIONS.map((option) => {
                const selected = preferences.textSize === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cyan-200 ${
                      selected
                        ? 'border-cyan-200/50 bg-cyan-200/10 text-cyan-50'
                        : 'border-slate-700/80 bg-slate-900/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reader-text-size"
                      value={option.value}
                      checked={selected}
                      onChange={() => onUpdatePreferences({ textSize: option.value })}
                      className="sr-only"
                    />
                    <span className="text-sm">{option.label}</span>
                    <span className={`${option.sampleClass} font-serif`} aria-hidden="true">
                      Aa
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-lg font-medium text-slate-100">
              Reading surface
            </legend>
            <p className="mt-1 text-sm text-slate-500">Change the page behind the story text.</p>
            <div className="mt-3 space-y-2">
              {THEME_OPTIONS.map((option) => {
                const selected = preferences.theme === option.value;
                const ThemeIcon = option.value === 'dark' ? Moon : Sun;
                return (
                  <label
                    key={option.value}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cyan-200 ${
                      selected
                        ? 'border-cyan-200/50 bg-cyan-200/10'
                        : 'border-slate-700/80 bg-slate-900/50 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reader-theme"
                      value={option.value}
                      checked={selected}
                      onChange={() => onUpdatePreferences({ theme: option.value })}
                      className="sr-only"
                    />
                    <ThemeIcon className="h-4 w-4 shrink-0 text-cyan-200/70" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-200">
                        {option.label}
                      </span>
                      <span className="block text-xs text-slate-500">{option.description}</span>
                    </span>
                    {selected && <Check className="h-4 w-4 text-cyan-200" aria-hidden="true" />}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-lg font-medium text-slate-100">Line spacing</legend>
            <p className="mt-1 text-sm text-slate-500">
              Loosen the leading for comfortable long reads.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {LINE_HEIGHT_OPTIONS.map((option) => {
                const selected = (preferences.lineHeight ?? 'normal') === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cyan-200 ${
                      selected
                        ? 'border-cyan-200/50 bg-cyan-200/10 text-cyan-50'
                        : 'border-slate-700/80 bg-slate-900/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reader-line-height"
                      value={option.value}
                      checked={selected}
                      onChange={() => onUpdatePreferences({ lineHeight: option.value })}
                      className="sr-only"
                    />
                    <span className="text-sm">{option.label}</span>
                    <span
                      className={`${option.sampleClass} font-serif text-xs text-slate-400`}
                      aria-hidden="true"
                    >
                      Aa
                      <br />
                      Aa
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="border-t border-slate-800 pt-5">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1 focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-cyan-200">
              <input
                type="checkbox"
                checked={preferences.reduceMotion}
                onChange={(event) => onUpdatePreferences({ reduceMotion: event.target.checked })}
                className="mt-1 h-4 w-4 shrink-0 accent-cyan-200"
              />
              <span className="min-w-0">
                <span className="block font-serif text-lg text-slate-100">Reduce motion</span>
                <span className="mt-0.5 block text-sm leading-5 text-slate-500">
                  Soften transitions and pause nonessential atmospheric movement.
                </span>
              </span>
            </label>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
