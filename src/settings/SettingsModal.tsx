import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { useUiStore } from "@/ui/stores/uiStore";
import { useSettingsStore } from "./settingsStore";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { workspaceService } from "@/workspace/workspaceService";

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
        apiKey: settings.apiKey,
        useOnlineCompiler: settings.useOnlineCompiler,
      });
    }
  }, [openModal, settings]);

  if (!openModal) return null;

  const handleSave = async () => {
    settings.updateSettings(draft);
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
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === "ko" ? "한국어" : "English"}
                </option>
              ))}
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

          <Field label={t("settings.compilerMode")}>
            <select
              value={draft.useOnlineCompiler ? "online" : "local"}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  useOnlineCompiler: e.target.value === "online",
                }))
              }
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)]"
            >
              <option value="local">{t("compiler.modeLocal")}</option>
              <option value="online">{t("compiler.modeOnline")}</option>
            </select>
          </Field>

          {draft.useOnlineCompiler ? (
            <Field label={t("settings.apiKey")}>
              <input
                value={draft.apiKey}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, apiKey: e.target.value }))
                }
                placeholder="YOUR_API_KEY"
                type="password"
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm font-mono text-[var(--text-primary)]"
              />
            </Field>
          ) : (
            <Field label={t("settings.compilerPath")}>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    value={draft.compilerPath}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, compilerPath: e.target.value }))
                    }
                    placeholder="C:\msys64\mingw64\bin\g++.exe"
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
          )}

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
