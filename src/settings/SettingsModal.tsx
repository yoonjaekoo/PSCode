import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { useUiStore } from "@/ui/stores/uiStore";
import { useSettingsStore } from "./settingsStore";
import { workspaceService } from "@/workspace/workspaceService";
import { CPP_SNIPPETS } from "../snippets/cppSnippets";

export function SettingsModal() {
  const { t } = useTranslation();
  const openModal = useUiStore((s) => s.settingsOpen);
  const setOpen = useUiStore((s) => s.setSettingsOpen);
  const settings = useSettingsStore();
  const [draft, setDraft] = useState({
    language: settings.language,
    compilerPath: settings.compilerPath,
    workspaceRoot: settings.workspaceRoot,
    autosaveIntervalMs: settings.autosaveIntervalMs,
    snippetsEnabled: settings.snippetsEnabled,
    enabledSnippets: { ...settings.enabledSnippets },
    gitUrl: settings.gitUrl,
    apiKey: settings.apiKey,
    useOnlineCompiler: settings.useOnlineCompiler,
  });

  useEffect(() => {
    if (openModal) {
      setDraft({
        language: settings.language,
        compilerPath: settings.compilerPath,
        workspaceRoot: settings.workspaceRoot,
        autosaveIntervalMs: settings.autosaveIntervalMs,
        snippetsEnabled: settings.snippetsEnabled,
        enabledSnippets: { ...settings.enabledSnippets },
        gitUrl: settings.gitUrl,
        apiKey: settings.apiKey,
        useOnlineCompiler: settings.useOnlineCompiler,
      });
    }
  }, [openModal, settings]);

  if (!openModal) return null;

  const handleSave = async () => {
    settings.updateSettings({
      language: draft.language,
      compilerPath: draft.compilerPath,
      workspaceRoot: draft.workspaceRoot,
      autosaveIntervalMs: draft.autosaveIntervalMs,
      snippetsEnabled: draft.snippetsEnabled,
      enabledSnippets: draft.enabledSnippets,
      gitUrl: draft.gitUrl,
      apiKey: draft.apiKey,
      useOnlineCompiler: draft.useOnlineCompiler,
    });
    await settings.persistSettings();
    await settings.setLanguage(draft.language);
    await workspaceService.ensureWorkspace();
    await settings.detectCompiler();
    setOpen(false);
  };

  const browseWorkspace = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: t("settings.workspaceRoot"),
    });
    if (selected) {
      setDraft((d) => ({ ...d, workspaceRoot: selected }));
    }
  };

  const detectCompiler = async () => {
    settings.updateSettings({ compilerPath: draft.compilerPath });
    await settings.detectCompiler();
    setDraft((d) => ({
      ...d,
      compilerPath: useSettingsStore.getState().compilerPath,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("settings.title")}
          </h2>
        </div>

        <div className="p-4 space-y-4">
          <Field label={t("settings.language")}>
            <select
              value={draft.language}
              onChange={(e) =>
                setDraft((d) => ({ ...d, language: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)]"
            >
              <option value="ko">한국어</option>
            </select>
          </Field>

          <Field label={t("settings.workspaceRoot")}>
            <div className="flex gap-2">
              <input
                value={draft.workspaceRoot}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, workspaceRoot: e.target.value }))
                }
                className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm font-mono text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={() => void browseWorkspace()}
                className="px-3 py-2 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded transition-colors text-[var(--text-primary)]"
              >
                {t("settings.browse")}
              </button>
            </div>
          </Field>

          <Field label="Git Repository URL">
            <input
              type="text"
              value={draft.gitUrl}
              onChange={(e) =>
                setDraft((d) => ({ ...d, gitUrl: e.target.value }))
              }
              placeholder="https://github.com/username/repository.git"
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent)]"
            />
          </Field>

          <Field label={t("settings.compilerPath")}>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  value={draft.compilerPath}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, compilerPath: e.target.value }))
                  }
                  placeholder="C:\\msys64\\mingw64\\bin\\g++.exe"
                  className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm font-mono text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => void detectCompiler()}
                  className="px-3 py-2 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded transition-colors text-[var(--text-primary)]"
                >
                  {t("compiler.detect")}
                </button>
              </div>
              {!settings.compilerFound && (
                <button
                  type="button"
                  disabled={settings.isInstalling}
                  onClick={() => void settings.installCompiler()}
                  className="w-full py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  {settings.isInstalling ? t("compiler.installing") : t("compiler.install")}
                </button>
              )}
            </div>
          </Field>

          <div className="pt-2 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              OnlineCompiler.io
            </h3>

            <Field label="API Key">
              <input
                type="password"
                value={draft.apiKey}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, apiKey: e.target.value }))
                }
                placeholder="Enter your OnlineCompiler.io API key"
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm font-mono text-[var(--text-primary)]"
              />
            </Field>

            <Field label="Use Online Compiler">
              <label className="inline-flex items-center space-x-2 mt-1">
                <input
                  type="checkbox"
                  checked={draft.useOnlineCompiler}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      useOnlineCompiler: e.target.checked,
                    }))
                  }
                  className="form-checkbox h-4 w-4 text-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  Compile and run via OnlineCompiler.io API (required for Android)
                </span>
              </label>
            </Field>
          </div>

          <Field label={t("settings.autosave")}>
            <input
              type="number"
              min={300}
              max={10000}
              step={100}
              value={draft.autosaveIntervalMs}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  autosaveIntervalMs: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)]"
            />
          </Field>

          {/* Snippet Controls */}
          <Field label={t("settings.snippetsEnabled")}>
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={draft.snippetsEnabled}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, snippetsEnabled: e.target.checked }))
                }
                className="form-checkbox h-4 w-4 text-[var(--accent)]"
              />
              <span>{t("settings.enableSnippets")}</span>
            </label>
          </Field>

          {draft.snippetsEnabled && (
            <Field label={t("settings.individualSnippets")}>
              <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                {CPP_SNIPPETS.map((s) => (
                  <label key={s.label} className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={draft.enabledSnippets[s.label] ?? true}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          enabledSnippets: {
                            ...d.enabledSnippets,
                            [s.label]: e.target.checked,
                          },
                        }))
                      }
                      className="form-checkbox h-4 w-4 text-[var(--accent)]"
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {t("settings.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            className="px-4 py-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded"
          >
            {t("settings.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-[var(--text-secondary)]">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
