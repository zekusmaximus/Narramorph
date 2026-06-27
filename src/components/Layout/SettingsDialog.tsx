import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import { useDialogFocus } from '@/hooks/useDialogFocus';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps): ReactElement | null {
  const dialogRef = useDialogFocus(open, onClose);
  if (!open) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0a0e12] rounded-lg shadow-2xl shadow-cyan-500/20 border border-cyan-500/30 max-w-md w-full p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="settings-title"
            className="text-2xl font-bold text-cyan-400 font-mono uppercase tracking-wider"
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cyan-400 transition-colors text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">⚙️</div>
          <div className="text-sm font-mono uppercase tracking-wider">
            Settings panel coming soon
          </div>
          <div className="text-xs text-gray-600 mt-1 font-mono">
            Theme, text size, and preferences
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
