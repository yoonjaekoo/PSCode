import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import i18n from "@/i18n";
import type { AppSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

interface SettingsState extends AppSettings {
  loaded: boolean;
  compilerFound: boolean;
  isInstalling: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => void;
  persistSettings: () => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  detectCompiler: () => Promise<void>;
  installCompiler: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,
  compilerFound: false,
  isInstalling: false,

  loadSettings: async () => {
    try {
      const settings = await invoke<AppSettings>("get_settings");
      set({ ...settings, loaded: true });
      await i18n.changeLanguage(settings.language);
      await get().detectCompiler();
      if (settings.workspaceRoot) {
        await invoke("ensure_workspace", {
          workspaceRoot: settings.workspaceRoot,
        });
      }
    } catch {
      set({ loaded: true });
    }
  },

  updateSettings: (partial) => set(partial),

  persistSettings: async () => {
    const {
      language,
      compilerPath,
      workspaceRoot,
      autosaveIntervalMs,
      recentFiles,
      sidebarCollapsed,
      consoleHeight,
      gitUrl,
      snippetsEnabled,
      enabledSnippets,
      apiKey,
      useOnlineCompiler,
    } = get();
    await invoke("save_settings", {
      settings: {
        language,
        compilerPath,
        workspaceRoot,
        autosaveIntervalMs,
        recentFiles,
        sidebarCollapsed,
        consoleHeight,
        gitUrl,
        snippetsEnabled,
        enabledSnippets,
        apiKey,
        useOnlineCompiler,
      },
    });
  },

  setLanguage: async (lang) => {
    set({ language: lang });
    await i18n.changeLanguage(lang);
    await get().persistSettings();
  },

  detectCompiler: async () => {
    const { compilerPath } = get();
    const info = await invoke<{ path: string; found: boolean }>("detect_compiler", {
      customPath: compilerPath || null,
    });
    set({
      compilerFound: info.found,
      compilerPath: info.found ? info.path : compilerPath,
    });
  },

  installCompiler: async () => {
    if (get().isInstalling) return;
    set({ isInstalling: true });
    try {
      await invoke("install_compiler");
      await get().detectCompiler();
    } finally {
      set({ isInstalling: false });
    }
  },
}));
