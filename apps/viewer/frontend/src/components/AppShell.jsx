import { useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";
import { getTheme } from "../styles/theme";
import { useSettings } from "../hooks/useSettings";
import Toolbar from "./Layout/Toolbar";
import Sidebar from "./Layout/Sidebar";
import StatusBar from "./Layout/StatusBar";
import FolderPicker from "./FileExplorer/FolderPicker";
import SettingsModal from "./Settings/SettingsModal";
import ConfirmDialog from "./Settings/ConfirmDialog";
import "./AppShell.css";

export const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppShell");
  }
  return context;
};

export default function AppShell({ children }) {
  const { settings, updateSetting, resetSettings } = useSettings();

  const [isDark, setIsDark] = useState(false);
  const theme = useMemo(() => getTheme(isDark), [isDark]);

  const [mode, setMode] = useState("ide");

  const [rootFolder, setRootFolder] = useState(null);

  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabPath, setActiveTabPath] = useState(null);

  const [parseResult, setParseResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [analysisView, setAnalysisView] = useState("tokens");
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(null);
  const [highlightRequest, setHighlightRequest] = useState(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState(null);

  const activeTab = openTabs.find((tab) => tab.path === activeTabPath) || null;

  const hasUnsavedFiles = openTabs.some((tab) => tab.isDirty);

  const openFile = useCallback(
    async (file, forceNewTab = false) => {
      const isTontoFile = file.name.endsWith(".tonto");

      const existingTab = openTabs.find((tab) => tab.path === file.path);
      if (existingTab) {
        setActiveTabPath(file.path);
        return;
      }

      let content = "";
      if (window.pywebview && window.pywebview.api) {
        try {
          content = await window.pywebview.api.read_file(file.path);
        } catch (error) {
          console.error("Failed to read file:", error);
          return;
        }
      } else {
        content = `// Mock content for ${file.name}\npackage Example\n\nkind Person\n`;
      }

      const newTab = {
        path: file.path,
        name: file.name,
        content,
        originalContent: content,
        isDirty: false,
      };

      if (forceNewTab || openTabs.length === 0) {
        setOpenTabs((prev) => [...prev, newTab]);
      } else {
        const activeIndex = openTabs.findIndex((tab) => tab.path === activeTabPath);
        const replaceIndex = activeIndex >= 0 ? activeIndex : 0;
        setOpenTabs((prev) => {
          const updated = [...prev];
          updated[replaceIndex] = newTab;
          return updated;
        });
      }

      setActiveTabPath(file.path);

      if (isTontoFile) {
        await parseContent(content);
      } else {
        setParseResult(null);
      }
    },
    [openTabs, activeTabPath]
  );

  const closeTab = useCallback(
    (path) => {
      const tabIndex = openTabs.findIndex((tab) => tab.path === path);
      if (tabIndex === -1) return;

      const newTabs = openTabs.filter((tab) => tab.path !== path);
      setOpenTabs(newTabs);

      if (path === activeTabPath) {
        if (newTabs.length === 0) {
          setActiveTabPath(null);
          setParseResult(null);
        } else {
          const newIndex = Math.min(tabIndex, newTabs.length - 1);
          setActiveTabPath(newTabs[newIndex].path);
        }
      }
    },
    [openTabs, activeTabPath]
  );

  const updateTabContent = useCallback(
    (path, newContent) => {
      setOpenTabs((prev) =>
        prev.map((tab) => {
          if (tab.path !== path) return tab;
          return {
            ...tab,
            content: newContent,
            isDirty: newContent !== tab.originalContent,
          };
        })
      );
    },
    []
  );

  const saveTab = useCallback(
    async (path) => {
      const tab = openTabs.find((t) => t.path === path);
      if (!tab || !tab.isDirty) return;

      if (window.pywebview && window.pywebview.api) {
        try {
          await window.pywebview.api.write_file(path, tab.content);
        } catch (error) {
          console.error("Failed to save file:", error);
          return;
        }
      }

      setOpenTabs((prev) =>
        prev.map((t) => {
          if (t.path !== path) return t;
          return {
            ...t,
            originalContent: t.content,
            isDirty: false,
          };
        })
      );

      if (tab.name.endsWith(".tonto")) {
        await parseContent(tab.content);
      }
    },
    [openTabs]
  );

  const parseContent = useCallback(async (content) => {
    setIsLoading(true);
    try {
      if (window.pywebview && window.pywebview.api) {
        const result = await window.pywebview.api.parse_content(content);
        setParseResult(result);
      } else {
        setParseResult({
          tokens: [
            { type: "KEYWORD", value: "package", line: 1, column: 1 },
            { type: "ID", value: "Example", line: 1, column: 9 },
            { type: "KEYWORD", value: "kind", line: 3, column: 1 },
            { type: "ID", value: "Person", line: 3, column: 6 },
          ],
          ast: { type: "Program", packages: [] },
          errors: [],
        });
      }
    } catch (error) {
      console.error("Parse error:", error);
      setParseResult({
        tokens: [],
        ast: null,
        errors: [{ message: String(error), line: 1, column: 1 }],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchTab = useCallback(
    (direction) => {
      if (openTabs.length <= 1) return;
      const currentIndex = openTabs.findIndex((tab) => tab.path === activeTabPath);
      let newIndex;
      if (direction === "next") {
        newIndex = (currentIndex + 1) % openTabs.length;
      } else {
        newIndex = (currentIndex - 1 + openTabs.length) % openTabs.length;
      }
      setActiveTabPath(openTabs[newIndex].path);
    },
    [openTabs, activeTabPath]
  );

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const selectFolder = useCallback(async () => {
    if (window.pywebview && window.pywebview.api) {
      try {
        const folder = await window.pywebview.api.select_folder();
        if (folder) {
          setOpenTabs([]);
          setActiveTabPath(null);
          setParseResult(null);
          setRootFolder(folder);
        }
      } catch (error) {
        console.error("Failed to select folder:", error);
      }
    } else {
      console.log("PyWebView not available, using mock folder");
      setOpenTabs([]);
      setActiveTabPath(null);
      setParseResult(null);
      setRootFolder("/mock/project/folder");
    }
  }, []);

  const requestFolderChange = useCallback(() => {
    if (hasUnsavedFiles && settings.onCloseUnsaved === "confirm") {
      const unsavedCount = openTabs.filter((tab) => tab.isDirty).length;
      setConfirmDialog({
        message: `You have ${unsavedCount} unsaved file${unsavedCount > 1 ? "s" : ""}. Changing folders will discard all unsaved changes.`,
        confirmText: "Change Folder",
        cancelText: "Cancel",
        variant: "warning",
        onConfirm: () => {
          setConfirmDialog(null);
          selectFolder();
        },
        onCancel: () => {
          setConfirmDialog(null);
        },
      });
    } else if (hasUnsavedFiles && settings.onCloseUnsaved === "save") {
      const saveAllAndChange = async () => {
        for (const tab of openTabs) {
          if (tab.isDirty) {
            await saveTab(tab.path);
          }
        }
        selectFolder();
      };
      saveAllAndChange();
    } else {
      selectFolder();
    }
  }, [hasUnsavedFiles, settings.onCloseUnsaved, openTabs, selectFolder, saveTab]);

  const showConfirmDialog = (dialogConfig) => {
    setConfirmDialog(dialogConfig);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(null);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-background", theme.background);
    root.style.setProperty("--color-background-secondary", theme.backgroundSecondary);
    root.style.setProperty("--color-background-tertiary", theme.backgroundTertiary);
    root.style.setProperty("--color-surface", theme.surface);
    root.style.setProperty("--color-surface-hover", theme.surfaceHover);
    root.style.setProperty("--color-surface-active", theme.surfaceActive);
    root.style.setProperty("--color-text", theme.text);
    root.style.setProperty("--color-text-secondary", theme.textSecondary);
    root.style.setProperty("--color-text-muted", theme.textMuted);
    root.style.setProperty("--color-border", theme.border);
    root.style.setProperty("--color-border-hover", theme.borderHover);
    root.style.setProperty("--color-primary", theme.primary);
    root.style.setProperty("--color-error", theme.error);
    root.style.setProperty("--color-warning", theme.warning);
    root.style.setProperty("--color-success", theme.success);
  }, [theme]);

  useEffect(() => {
    if (activeTab && activeTab.name.endsWith(".tonto")) {
      parseContent(activeTab.content);
    } else if (!activeTab) {
      setParseResult(null);
    }
  }, [activeTabPath]);

  const contextValue = {
    isDark,
    setIsDark,
    theme,
    mode,
    setMode,
    rootFolder,
    setRootFolder,
    requestFolderChange,
    openTabs,
    activeTabPath,
    activeTab,
    openFile,
    closeTab,
    updateTabContent,
    saveTab,
    switchTab,
    setActiveTabPath,
    hasUnsavedFiles,
    parseResult,
    setParseResult,
    parseContent,
    isLoading,
    setIsLoading,
    analysisView,
    setAnalysisView,
    selectedTokenIndex,
    setSelectedTokenIndex,
    highlightRequest,
    setHighlightRequest,
    settings,
    updateSetting,
    resetSettings,
    openSettingsModal,
    closeSettingsModal,
    showConfirmDialog,
    closeConfirmDialog,
  };

  if (!rootFolder) {
    return (
      <AppContext.Provider value={contextValue}>
        <div className="app-shell app-shell--empty">
          <FolderPicker />
        </div>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-shell">
        <Toolbar />
        <div className="app-shell__body">
          <Sidebar />
          <main className="app-shell__main">{children}</main>
        </div>
        <StatusBar />
      </div>

      <SettingsModal isOpen={isSettingsModalOpen} onClose={closeSettingsModal} />

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </AppContext.Provider>
  );
}
