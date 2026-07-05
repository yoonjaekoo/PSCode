import { useTranslation } from "react-i18next";
import { useEditorStore } from "@/editor/editorStore";
import { useEditorRefStore } from "@/editor/editorRefStore";
import { useSettingsStore } from "@/settings/settingsStore";
import { useUiStore } from "@/ui/stores/uiStore";
import { autoSpacing } from "@/lib/autoSpacing";
import { invoke } from "@tauri-apps/api/core";

export function StatusBar() {
  const { t } = useTranslation();
  const filePath = useEditorStore((s) => s.filePath);
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const setContent = useEditorStore((s) => s.setContent);
  const compilerFound = useSettingsStore((s) => s.compilerFound);
  const useOnlineCompiler = useSettingsStore((s) => s.useOnlineCompiler);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const language = useSettingsStore((s) => s.language);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const editorRef = useEditorRefStore((s) => s.editorRef);

  const fileName = filePath
    ? filePath.split(/[/\\]/).pop()
    : t("app.untitled");

  const statusLabel =
    saveStatus === "saving"
      ? t("status.saving")
      : saveStatus === "unsaved"
        ? t("status.unsaved")
        : t("status.saved");

  const handleFormat = () => {
    editorRef?.getAction("editor.action.formatDocument")?.run();
  };

  const handleAutoSpacing = () => {
    if (!editorRef) return;
    const currentContent = editorRef.getValue();
    const spaced = autoSpacing(currentContent);
    editorRef.setValue(spaced);
    setContent(spaced);
  };

  return (
    <footer className="flex items-center gap-4 px-3 py-1 text-xs bg-[var(--accent)] text-white shrink-0">
      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-1.5 px-2 py-0.5 -ml-1 hover:bg-white/10 rounded transition-colors"
        title={t("shortcuts.palette")}
      >
        <span className="text-[10px] border border-white/40 px-1 rounded opacity-80">
          ⌘P
        </span>
        {t("command.palette")}
      </button>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleFormat}
          className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-white/10 rounded transition-colors"
          title="Ctrl+Shift+F"
        >
          {t("command.formatCode")}
        </button>

        <button
          type="button"
          onClick={handleAutoSpacing}
          className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-white/10 rounded transition-colors border-l border-white/10"
          title={t("command.autoSpacing")}
        >
          {t("command.autoSpacing")}
        </button>
      </div>

      <div className="h-3 w-[1px] bg-white/20 mx-1" />

      <button
        type="button"
        onClick={async () => {
          const { workspaceRoot, gitUrl } = useSettingsStore.getState();
          try {
            const result = await invoke<string>("git_push", { workspaceRoot, gitUrl });
            alert(result);
          } catch (err) {
            alert(`Git Push Failed: ${err}`);
          }
        }}
        className="px-2 py-0.5 hover:bg-white/10 rounded transition-colors font-medium border border-white/20 text-white flex items-center gap-1"
        title="Git Add, Commit and Push to remote origin"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
        <span>Commit & Push</span>
      </button>

      <button
        type="button"
        onClick={async () => {
          const { workspaceRoot, gitUrl } = useSettingsStore.getState();
          try {
            const result = await invoke<string>("git_pull", { workspaceRoot, gitUrl });
            alert(result);
          } catch (err) {
            alert(`Git Pull Failed: ${err}`);
          }
        }}
        className="px-2 py-0.5 hover:bg-white/10 rounded transition-colors font-medium border border-white/20 text-white flex items-center gap-1"
        title="git fetch and pull from the remote origin"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
        <span>Pull</span>
      </button>

      <span className="truncate max-w-[40%]">{fileName}</span>
      <span>{statusLabel}</span>
      <span className="ml-auto">
        {useOnlineCompiler
          ? apiKey
            ? "OnlineCompiler.io"
            : t("compiler.notFound")
          : compilerFound
            ? t("compiler.found")
            : t("compiler.notFound")}
      </span>
      <span className="uppercase">{language}</span>
      <span className="opacity-80">{t("shortcuts.run")}</span>
    </footer>
  );
}
