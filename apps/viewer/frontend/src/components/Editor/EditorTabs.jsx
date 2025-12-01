import { useCallback } from "react";
import { X } from "lucide-react";
import { useApp } from "../AppShell";
import "./EditorTabs.css";

export default function EditorTabs() {
  const {
    openTabs,
    activeTabPath,
    setActiveTabPath,
    closeTab,
    saveTab,
    settings,
    showConfirmDialog,
    closeConfirmDialog,
  } = useApp();

  const handleTabClick = (path) => {
    setActiveTabPath(path);
  };

  const handleClose = useCallback(
    (path) => {
      const tab = openTabs.find((t) => t.path === path);
      if (!tab) return;

      if (!tab.isDirty) {
        closeTab(path);
        return;
      }

      switch (settings.onCloseUnsaved) {
        case "confirm":
          showConfirmDialog({
            message: `"${tab.name}" has unsaved changes. Do you want to save before closing?`,
            confirmText: "Save",
            cancelText: "Don't Save",
            variant: "warning",
            onConfirm: async () => {
              closeConfirmDialog();
              await saveTab(path);
              closeTab(path);
            },
            onCancel: () => {
              closeConfirmDialog();
              closeTab(path);
            },
          });
          break;

        case "save":
          saveTab(path).then(() => closeTab(path));
          break;

        case "discard":
        default:
          closeTab(path);
          break;
      }
    },
    [openTabs, closeTab, saveTab, settings.onCloseUnsaved, showConfirmDialog, closeConfirmDialog]
  );

  const handleCloseClick = (e, path) => {
    e.stopPropagation();
    handleClose(path);
  };

  const handleMiddleClick = (e, path) => {
    if (e.button === 1) {
      e.preventDefault();
      handleClose(path);
    }
  };

  return (
    <div className="editor-tabs">
      <div className="editor-tabs__list">
        {openTabs.map((tab) => (
          <div
            key={tab.path}
            className={`editor-tabs__tab ${tab.path === activeTabPath ? "editor-tabs__tab--active" : ""} ${tab.isDirty ? "editor-tabs__tab--dirty" : ""}`}
            onClick={() => handleTabClick(tab.path)}
            onMouseDown={(e) => handleMiddleClick(e, tab.path)}
            title={tab.path}
          >
            <span className="editor-tabs__tab-name">
              {tab.isDirty && <span className="editor-tabs__dirty-dot"></span>}
              {tab.name}
            </span>
            <button
              className="editor-tabs__close-btn"
              onClick={(e) => handleCloseClick(e, tab.path)}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
