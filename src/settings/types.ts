export interface AppSettings {
  language: string;
  compilerPath: string;
  workspaceRoot: string;
  autosaveIntervalMs: number;
  recentFiles: string[];
  sidebarCollapsed: boolean;
  consoleHeight: number;
  gitUrl: string;
  snippetsEnabled: boolean;
  enabledSnippets: Record<string, boolean>;
  apiKey: string;
  useOnlineCompiler: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: "ko",
  compilerPath: "",
  workspaceRoot: "",
  autosaveIntervalMs: 800,
  recentFiles: [],
  sidebarCollapsed: false,
  consoleHeight: 200,
  gitUrl: "",
  snippetsEnabled: true,
  enabledSnippets: {},
  apiKey: "",
  useOnlineCompiler: false,
};
