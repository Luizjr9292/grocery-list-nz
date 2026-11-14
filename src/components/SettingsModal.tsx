import React, { useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  BookmarkCheck,
  Check,
  Cloud,
  CloudOff,
  Code2,
  LogIn,
  LogOut,
  Palette,
  RotateCcw,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { APP_THEMES, AppThemeId } from '../utils/appThemes';

interface SettingsModalProps {
  isOpen: boolean;
  hasSavedOriginal: boolean;
  authUser: User | null;
  isCloudSynced: boolean;
  activeTheme: AppThemeId;
  onSelectTheme: (themeId: AppThemeId) => void;
  onClose: () => void;
  onSaveAsOriginal: () => void;
  onRequestResetOriginal: () => void;
  onRequestRestoreFactory: () => void;
  onDownloadHtml: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  hasSavedOriginal,
  authUser,
  isCloudSynced,
  activeTheme,
  onSelectTheme,
  onClose,
  onSaveAsOriginal,
  onRequestResetOriginal,
  onRequestRestoreFactory,
  onDownloadHtml,
  onOpenAuth,
  onSignOut,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full theme-accent-ribbon" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--theme-primary-soft)] text-[var(--theme-primary-text)] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="settings-modal-title"
                className="font-display text-base font-semibold text-[var(--theme-text)]"
              >
                List Settings
              </h2>
              <p className="text-xs text-[var(--theme-text-muted)]">
                Customize your palette, default template, backups, and cloud account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Theme Settings */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-[var(--theme-text)] flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[var(--theme-primary)]" />
                Theme Settings
              </h3>
              <span className="text-xs text-[var(--theme-text-muted)]">
                {APP_THEMES.find((t) => t.id === activeTheme)?.name ?? 'Forest'} active
              </span>
            </div>
            <p className="text-xs text-[var(--theme-text-muted)] leading-relaxed">
              Switch the app color palette across surfaces and accent controls.
            </p>

            <div
              className="grid grid-cols-2 gap-2.5 pt-1"
              role="radiogroup"
              aria-label="Color palette"
            >
              {APP_THEMES.map((theme) => {
                const isSelected = theme.id === activeTheme;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectTheme(theme.id)}
                    className={`flex items-center justify-between gap-2.5 p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-[var(--theme-primary-soft)] border-[var(--theme-primary)] ring-1 ring-[var(--theme-primary)]'
                        : 'bg-[var(--theme-surface-muted)] border-[var(--theme-border)] hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {theme.swatchClasses.map((swatchClass, idx) => (
                          <span
                            key={idx}
                            aria-hidden="true"
                            className={`w-3.5 h-3.5 rounded-full border border-slate-300/70 ${swatchClass}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-[var(--theme-text)] truncate">
                        {theme.name}
                      </p>
                      <p className="text-[11px] text-[var(--theme-text-muted)] truncate">
                        {theme.subtitle}
                      </p>
                    </div>
                    {isSelected && (
                      <span
                        aria-hidden="true"
                        className="w-5 h-5 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center shrink-0"
                      >
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-[var(--theme-border)]" />

          {/* Section 2: Saved Original Template */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-[var(--theme-text)]">
                Original List Template
              </h3>
              <span className="text-xs text-slate-500">
                {hasSavedOriginal ? 'Custom original saved' : 'Using 12 factory categories'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Save your current customized categories and items as your personal Original so resetting never loses your edits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSaveAsOriginal();
                }}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <BookmarkCheck className="w-4 h-4 shrink-0" />
                Save Current as Original
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestResetOriginal();
                }}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                {hasSavedOriginal ? 'Reset to Saved Original' : 'Reset to Original'}
              </button>
            </div>

            {hasSavedOriginal && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestRestoreFactory();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-700 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Restore initial 12 factory categories instead
                </button>
              </div>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: Standalone HTML Backup */}
          <div className="space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Offline &amp; GitHub Pages Export
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export a standalone single-file <code className="text-slate-800">index.html</code> containing your current list for offline use or static hosting.
            </p>
            <button
              type="button"
              onClick={() => {
                onDownloadHtml();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-violet-800 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
            >
              <Code2 className="w-4 h-4" />
              Download HTML
            </button>
          </div>

          <hr className="border-slate-200" />

          {/* Section 3: Account & Cloud Sync */}
          <div className="space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Account &amp; Cloud Sync
            </h3>
            {authUser ? (
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Cloud
                    className={`w-4 h-4 shrink-0 ${
                      isCloudSynced ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {authUser.displayName || authUser.email}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {isCloudSynced
                        ? 'Synced across devices'
                        : 'Email verification pending'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 p-3 bg-sky-50/70 border border-sky-200 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CloudOff className="w-4 h-4 text-sky-600 shrink-0" />
                  <p className="text-xs text-slate-700">
                    Saving locally on this device only.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end px-5 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
