import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { compilerService } from "./compilerService";
import { onlineCompilerService } from "./onlineCompilerService";
import { useEditorStore } from "@/editor/editorStore";
import { useSettingsStore } from "@/settings/settingsStore";
import { useConsoleStore } from "@/ui/stores/consoleStore";
import { useTestcaseStore } from "@/testcase/testcaseStore";

export function useCompileRun() {
  const { t } = useTranslation();
  const run = useCallback(async () => {
    const { filePath, saveFile, content } = useEditorStore.getState();
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
            "OnlineCompiler.io API key not set. Configure it in Settings.",
          );
          consoleStore.setActiveTab("build");
          consoleStore.setRunning(false);
          return;
        }

        const result = await onlineCompilerService.compileAndRun(
          content,
          input,
          apiKey,
        );

        const buildLog = result.error || "";
        consoleStore.setBuildOutput(
          buildLog || (result.status === "success" ? "" : "Compilation failed"),
        );

        if (result.status === "success") {
          const runText = [
            result.output,
            result.error ? `[stderr]\n${result.error}` : "",
            `Execution: ${result.time}s | Total: ${result.total}s | Memory: ${result.memory}KB`,
          ]
            .filter(Boolean)
            .join("\n\n");
          consoleStore.setRunOutput(runText);
          consoleStore.setActiveTab("run");
        } else {
          consoleStore.setActiveTab("build");
        }
      } else {
        if (!compilerFound) {
          consoleStore.setBuildOutput(t("compiler.notFound"));
          consoleStore.setActiveTab("build");
          consoleStore.setRunning(false);
          return;
        }

        await saveFile();
        await compilerService
          .compileAndRun(filePath, input, compilerPath || undefined)
          .then((result) => {
            consoleStore.setBuildOutput(
              result.compileOutput ||
                (result.success ? "" : t("console.compileFailed")),
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
          });
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
