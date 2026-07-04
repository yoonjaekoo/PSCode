import { invoke } from "@tauri-apps/api/core";
import type { RunOutput } from "./types";

export const compilerService = {
  async compileAndRun(
    sourcePath: string,
    input: string,
    compilerPath?: string,
  ): Promise<RunOutput> {
    return invoke<RunOutput>("compile_and_run", {
      sourcePath,
      input,
      compilerPath: compilerPath || null,
    });
  },

  async onlineCompileAndRun(
    sourceCode: string,
    input: string,
    apiKey: string,
  ): Promise<RunOutput> {
    return invoke<RunOutput>("online_compile_and_run", {
      sourceCode,
      input,
      apiKey,
    });
  },

  async detectCompiler(customPath?: string) {
    return invoke<{ path: string; found: boolean }>("detect_compiler", {
      customPath: customPath || null,
    });
  },
};
