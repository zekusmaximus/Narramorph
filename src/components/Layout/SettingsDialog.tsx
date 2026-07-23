import { useMemo, type ReactElement } from 'react';

import type { LineHeight, TextSize, Theme, UserPreferences } from '@/types';
import { buildSampleRedactedEvent } from '@/utils/errorRedaction';

import { RecordSheetDialog, SectionHeading, Stamp } from './RecordSheetDialog';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (preferences: Partial<UserPreferences>) => void;
  reduceMotion: boolean;
}

const TEXT_SIZE_OPTIONS: ReadonlyArray<{ value: TextSize; label: string }> = [
  { value: 'small', label: 'Compact' },
  { value: 'medium', label: 'Comfortable' },
  { value: 'large', label: 'Large' },
];

const THEME_OPTIONS: ReadonlyArray<{
  value: Theme;
  label: string;
  description: string;
  swatch: string;
}> = [
  { value: 'light', label: 'Paper', description: 'Clear ink on a pale page', swatch: '#ffffff' },
  { value: 'dark', label: 'Night', description: 'Low-light archive surface', swatch: '#111827' },
  { value: 'sepia', label: 'Archive', description: 'Warm, weathered paper', swatch: '#fffbeb' },
];

const LINE_HEIGHT_OPTIONS: ReadonlyArray<{ value: LineHeight; label: string }> = [
  { value: 'cozy', label: 'Cozy' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Airy' },
];

/** A hairline-ruled segmented row of radio cells; the selected cell is stamped. */
function SegmentedRow<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}): ReactElement {
  return (
    <div className="grid grid-cols-3 border border-[#2b3b44]">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className={`relative flex min-h-11 cursor-pointer items-center justify-between gap-2 border-r border-[#2b3b44] px-3 text-[13px] transition-colors last:border-r-0 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[#a5f3fc] ${
              selected ? 'bg-[#132027] text-[#eef4f6]' : 'text-[#b7c6ce] hover:bg-white/[0.03]'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span>{option.label}</span>
            {selected && <Stamp checked />}
          </label>
        );
      })}
    </div>
  );
}

export function SettingsDialog({
  open,
  onClose,
  preferences,
  onUpdatePreferences,
  reduceMotion,
}: SettingsDialogProps): ReactElement | null {
  const sampleReport = useMemo(() => JSON.stringify(buildSampleRedactedEvent(), null, 2), []);

  if (!open) {
    return null;
  }

  const reduceMotionOn = Boolean(preferences.reduceMotion);
  const crashReportsOn = Boolean(preferences.errorReportingConsent);

  return (
    <RecordSheetDialog
      open={open}
      onClose={onClose}
      reduceMotion={reduceMotion}
      classification="READER PREFERENCES · FORM R-3"
      title="Shape the reading room"
      titleId="settings-title"
      closeLabel="Close settings"
    >
      <div className="space-y-6">
        <fieldset className="min-w-0">
          <legend className="mb-2 w-full p-0">
            <SectionHeading index="01">Text size</SectionHeading>
          </legend>
          <SegmentedRow
            name="reader-text-size"
            value={preferences.textSize}
            options={TEXT_SIZE_OPTIONS}
            onChange={(textSize) => onUpdatePreferences({ textSize })}
          />
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-2 w-full p-0">
            <SectionHeading index="02">Reading surface</SectionHeading>
          </legend>
          <div className="border border-[#2b3b44]">
            {THEME_OPTIONS.map((option) => {
              const selected = preferences.theme === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 border-b border-[#1d2b33] px-3 py-2 transition-colors last:border-b-0 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[#a5f3fc] ${
                    selected ? 'bg-[#132027]' : 'hover:bg-white/[0.03]'
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
                  <span className="min-w-0 flex-1 text-[13px]">
                    <span className={selected ? 'text-[#eef4f6]' : 'text-[#b7c6ce]'}>
                      {option.label}
                    </span>{' '}
                    <span className="text-[#7e929c]">— {option.description}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-[14px] w-[14px] shrink-0 border border-[#38505b]"
                    style={{ backgroundColor: option.swatch }}
                  />
                  {selected && <Stamp checked />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-2 w-full p-0">
            <SectionHeading index="03">Line spacing</SectionHeading>
          </legend>
          <SegmentedRow
            name="reader-line-height"
            value={preferences.lineHeight ?? 'normal'}
            options={LINE_HEIGHT_OPTIONS}
            onChange={(lineHeight) => onUpdatePreferences({ lineHeight })}
          />
        </fieldset>

        <div className="min-w-0">
          <SectionHeading index="04">Reduce motion</SectionHeading>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 border border-[#2b3b44] px-3 py-2 transition-colors hover:bg-white/[0.03] focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[#a5f3fc]">
            <input
              type="checkbox"
              checked={reduceMotionOn}
              onChange={(event) => onUpdatePreferences({ reduceMotion: event.target.checked })}
              className="sr-only"
            />
            <span className="min-w-0 flex-1 text-[13px]">
              <span className="block text-[#dfe8ec]">Reduce motion</span>
              <span className="mt-0.5 block text-[12px] leading-5 text-[#7e929c]">
                Soften transitions and pause nonessential atmospheric movement.
              </span>
            </span>
            <span
              aria-hidden="true"
              className="flex h-5 w-5 shrink-0 items-center justify-center border border-[#2b3b44]"
            >
              <span
                className={`font-mono text-[11px] leading-none ${
                  reduceMotionOn ? 'text-[#a5f3fc]' : 'text-[#7e929c]'
                }`}
              >
                {reduceMotionOn ? '[×]' : '[ ]'}
              </span>
            </span>
          </label>
        </div>

        <div className="min-w-0 border-t border-[#1d2b33] pt-5">
          <SectionHeading index="05">Anonymous crash reports</SectionHeading>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 border border-[#2b3b44] px-3 py-2 transition-colors hover:bg-white/[0.03] focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[#a5f3fc]">
            <input
              type="checkbox"
              checked={crashReportsOn}
              onChange={(event) =>
                onUpdatePreferences({ errorReportingConsent: event.target.checked })
              }
              className="sr-only"
            />
            <span className="min-w-0 flex-1 text-[13px]">
              <span className="block text-[#dfe8ec]">Send anonymous crash reports</span>
              <span className="mt-0.5 block text-[12px] leading-5 text-[#7e929c]">
                Help fix problems by sending redacted, anonymous error reports. Off by default. Your
                reading history, saved journeys, and passage text are never included.
              </span>
            </span>
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-[#2b3b44]"
            >
              <span
                className={`font-mono text-[11px] leading-none ${
                  crashReportsOn ? 'text-[#a5f3fc]' : 'text-[#7e929c]'
                }`}
              >
                {crashReportsOn ? '[×]' : '[ ]'}
              </span>
            </span>
          </label>
          <details className="mt-2 pl-1 text-[12px] text-[#7e929c]">
            <summary className="cursor-pointer text-[#8fa3ad] transition-colors hover:text-[#b7c6ce] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5f3fc]">
              See exactly what a report would contain
            </summary>
            <p className="mt-2 leading-5">
              A crash report is scrubbed on your device before sending — the URL is stripped to the
              page (no passage), and no console log, saved data, or prose is included. A
              representative report:
            </p>
            <pre className="mt-2 overflow-auto border border-[#1d2b33] bg-[#080d10] p-2 font-mono text-[11px] text-[#93a5ae]">
              {sampleReport}
            </pre>
          </details>
        </div>
      </div>
    </RecordSheetDialog>
  );
}
