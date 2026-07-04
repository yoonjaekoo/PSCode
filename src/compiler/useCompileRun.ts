import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { compilerService } from "./compilerService";
import { useEditorStore } from "@/editor/editorStore";
import { useSettingsStore } from "@/settings/settingsStore";
import { useConsoleStore } from "@/ui/stores/consoleStore";
import { useTestcaseStore } from "@/testcase/testcaseStore";

function formatResult(
  result: import("./types").RunOutput,
  t: (key: string, opts?: Record<string, unknown>) => string,
  consoleStore: ReturnType<typeof useConsoleStore.getState>,
) {
  consoleStore.setBuildOutput(
    result.compileOutput || (result.success ? "" : t("console.compileFailed")),
  );

  if (result.compileOutput && !result.success && !result.runOutput) {
    consoleStore.setActiveTab("build");
  } else {
    const runText = [
      result.runOutput,
      result.runError ? `[stderr]\n${result.runError}` : "",
      t("console.executionTime", { ms: result.executionTimeMs }),
    ]
      .filter(Boolean)
      .join("\n\n");
    consoleStore.setRunOutput(runText);
    consoleStore.setActiveTab("run");
  }
}

export function useCompileRun() {
  const { t } = useTranslation();
  const run = useCallback(async () => {
    const { filePath, content, saveFile } = useEditorStore.getState();
    const { compilerPath, compilerFound, apiKey, useOnlineCompiler } =
      useSettingsStore.getState();
    const { input } = useTestcaseStore.getState();
    const consoleStore = useConsoleStore.getState();

    if (!filePath) return;

    consoleStore.setRunning(true);
    consoleStore.setActiveTab("build");
    consoleStore.setBuildOutput(t("console.running"));
    consoleStore.setRunOutput("");

    try {
      if (useOnlineCompiler) {
        if (!apiKey) {
          consoleStore.setBuildOutput(
            "API key is not set. Enter your OnlineCompiler.io API key in Settings.",
          );
          consoleStore.setActiveTab("build");
          consoleStore.setRunning(false);
          return;
        }
        await saveFile();
        const sourceCode = content || "";
        const result = await compilerService.onlineCompileAndRun(
          sourceCode,
          input,
          apiKey,
        );
        formatResult(result, t, consoleStore);
      } else {
        if (!compilerFound) {
          consoleStore.setBuildOutput(t("compiler.notFound"));
          consoleStore.setActiveTab("build");
          consoleStore.setRunning(false);
          return;
        }
        await saveFile();
        const result = await compilerService.compileAndRun(
          filePath,
          input,
          compilerPath || undefined,
        );
        formatResult(result, t, consoleStore);
      }
    } catch (err) {
      consoleStore.setBuildOutput(String(err));
      consoleStore.setActiveTab("build");
    } finally {
      consoleStore.setRunning(false);
    }
  }, [t]);

  return { run };
}
