import { useState, useEffect } from "react";
import { useApp } from "../AppShell";
import "./FileTree.css";

function FileTreeItem({ item, level = 0 }) {
  const { activeTabPath, openFile } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  const isFolder = item.type === "directory";
  const isTontoFile = item.name.endsWith(".tonto");
  const isSelected = activeTabPath === item.path;

  const handleClick = async (e) => {
    if (isFolder) {
      if (!isExpanded && children.length === 0) {
        await loadChildren();
      }
      setIsExpanded(!isExpanded);
    } else {
      const forceNewTab = e.ctrlKey || e.metaKey;
      openFile(item, forceNewTab);
    }
  };

  const loadChildren = async () => {
    setIsLoadingChildren(true);
    try {
      if (window.pywebview && window.pywebview.api) {
        const items = await window.pywebview.api.list_directory(item.path);
        setChildren(items);
      } else {
        setChildren([
          { name: "example.tonto", path: `${item.path}/example.tonto`, type: "file" },
          { name: "subdir", path: `${item.path}/subdir`, type: "directory" },
        ]);
      }
    } catch (error) {
      console.error("Failed to load directory:", error);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const getIcon = () => {
    if (isFolder) {
      return isExpanded ? "▼" : "▶";
    }
    if (isTontoFile) {
      return "◆";
    }
    return "○";
  };

  return (
    <div className="file-tree-item">
      <div
        className={`file-tree-item__row ${isSelected ? "file-tree-item__row--selected" : ""} ${isTontoFile ? "file-tree-item__row--tonto" : ""}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <span className={`file-tree-item__icon ${isFolder ? "file-tree-item__icon--folder" : ""}`}>
          {isLoadingChildren ? "..." : getIcon()}
        </span>
        <span className="file-tree-item__name">{item.name}</span>
      </div>

      {isFolder && isExpanded && (
        <div className="file-tree-item__children">
          {children.map((child) => (
            <FileTreeItem key={child.path} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ rootPath }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoot();
  }, [rootPath]);

  const loadRoot = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (window.pywebview && window.pywebview.api) {
        const items = await window.pywebview.api.list_directory(rootPath);
        setItems(items);
      } else {
        setItems([
          { name: "src", path: `${rootPath}/src`, type: "directory" },
          { name: "example.tonto", path: `${rootPath}/example.tonto`, type: "file" },
          { name: "README.md", path: `${rootPath}/README.md`, type: "file" },
        ]);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="file-tree file-tree--loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="file-tree file-tree--error">
        <span>Error loading files</span>
        <button onClick={loadRoot}>Retry</button>
      </div>
    );
  }

  return (
    <div className="file-tree">
      {items.map((item) => (
        <FileTreeItem key={item.path} item={item} />
      ))}
    </div>
  );
}
