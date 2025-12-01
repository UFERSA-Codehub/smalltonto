import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration } from "@codemirror/view";
import { EditorState, StateField, StateEffect } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting, StreamLanguage } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { useApp } from "../AppShell";
import "./CodeEditor.css";

const tontoLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;

    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }

    if (stream.match("/*")) {
      while (!stream.eol()) {
        if (stream.match("*/")) break;
        stream.next();
      }
      return "comment";
    }

    if (stream.match(/"([^"\\]|\\.)*"/)) {
      return "string";
    }

    if (stream.match(/\d+(\.\d+)?/)) {
      return "number";
    }

    if (stream.match(/[a-zA-Z_]\w*/)) {
      const word = stream.current();

      const keywords = [
        "package", "import", "class", "relation", "attribute", "enum",
        "genset", "gen", "disjoint", "complete", "specializesFrom",
        "restricts", "subsets", "redefines", "of", "to", "from",
        "ordered", "readonly", "derived", "const", "begin", "end"
      ];
      if (keywords.includes(word)) return "keyword";

      const stereotypes = [
        "kind", "subkind", "phase", "role", "mixin", "category",
        "phaseMixin", "roleMixin", "relator", "mode", "quality",
        "quantity", "collective", "type", "powertype", "historicalRole",
        "historicalRoleMixin", "event", "situation", "process", "abstract"
      ];
      if (stereotypes.includes(word)) return "typeName";

      const relationTypes = [
        "mediation", "material", "comparative", "derivation",
        "characterization", "externalDependence", "componentOf",
        "memberOf", "subCollectionOf", "subQuantityOf", "instantiation",
        "termination", "participational", "participation", "historicalDependence",
        "creation", "manifestation", "bringsAbout", "triggers"
      ];
      if (relationTypes.includes(word)) return "typeName";

      const natures = [
        "functional-complexes", "collectives", "quantities", "relators",
        "intrinsic-modes", "extrinsic-modes", "qualities", "events",
        "situations", "processes", "types", "abstracts"
      ];
      if (natures.includes(word)) return "typeName";

      if (word === "true" || word === "false" || word === "null") {
        return "atom";
      }

      return "variableName";
    }

    if (stream.match(/[{}()\[\];,.:@]/)) {
      return "punctuation";
    }

    if (stream.match(/[+\-*/<>=!&|~^%]+/)) {
      return "operator";
    }

    stream.next();
    return null;
  },
});

function createHighlightStyle(theme) {
  return HighlightStyle.define([
    { tag: tags.keyword, color: theme.keyword },
    { tag: tags.typeName, color: theme.type },
    { tag: tags.string, color: theme.string },
    { tag: tags.number, color: theme.number },
    { tag: tags.comment, color: theme.comment, fontStyle: "italic" },
    { tag: tags.operator, color: theme.operator },
    { tag: tags.punctuation, color: theme.textSecondary },
    { tag: tags.variableName, color: theme.variable },
    { tag: tags.atom, color: theme.number },
  ]);
}

function createEditorTheme(theme) {
  return EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "14px",
      backgroundColor: theme.background,
      color: theme.text,
    },
    ".cm-content": {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      caretColor: theme.text,
    },
    ".cm-cursor": {
      borderLeftColor: theme.text,
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: theme.selection,
    },
    ".cm-activeLine": {
      backgroundColor: theme.surfaceHover,
    },
    ".cm-activeLineGutter": {
      backgroundColor: theme.surfaceHover,
    },
    ".cm-gutters": {
      backgroundColor: theme.backgroundSecondary,
      color: theme.textMuted,
      border: "none",
      borderRight: `1px solid ${theme.border}`,
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 16px",
    },
    ".cm-error-line": {
      backgroundColor: `${theme.error}15`,
    },
    ".cm-error-line-gutter": {
      backgroundColor: `${theme.error}25`,
    },
    ".cm-token-highlight": {
      backgroundColor: `${theme.primary}35`,
      borderRadius: "2px",
    },
    ".cm-error-highlight": {
      backgroundColor: `${theme.error}40`,
      borderRadius: "2px",
    },
  });
}

const setErrorLinesEffect = StateEffect.define();
const setHighlightEffect = StateEffect.define();
const clearHighlightEffect = StateEffect.define();

const errorLineDecoration = Decoration.line({ class: "cm-error-line" });
const errorLineGutterDecoration = Decoration.line({ class: "cm-error-line-gutter" });

const errorLinesField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setErrorLinesEffect)) {
        const { errorLines, doc } = effect.value;
        const decos = [];
        for (const lineNum of errorLines) {
          if (lineNum >= 1 && lineNum <= doc.lines) {
            const line = doc.line(lineNum);
            decos.push(errorLineDecoration.range(line.from));
          }
        }
        return Decoration.set(decos, true);
      }
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const highlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setHighlightEffect)) {
        const { from, to, type } = effect.value;
        const className = type === "error" ? "cm-error-highlight" : "cm-token-highlight";
        const mark = Decoration.mark({ class: className });
        return Decoration.set([mark.range(from, to)]);
      }
      if (effect.is(clearHighlightEffect)) {
        return Decoration.none;
      }
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

export default function CodeEditor() {
  const {
    activeTab,
    updateTabContent,
    saveTab,
    parseContent,
    parseResult,
    theme,
    settings,
    setSelectedTokenIndex,
    setAnalysisView,
    highlightRequest,
    setHighlightRequest,
  } = useApp();
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const debounceRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const tokenSyncDebounceRef = useRef(null);

  const debouncedAutoAction = useCallback(
    (content, path) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        if (settings.autoSaveToDisk) {
          saveTab(path);
        }
        else if (settings.autoSaveToReparse) {
          parseContent(content);
        }
      }, settings.autoSaveDelay);
    },
    [parseContent, saveTab, settings.autoSaveToDisk, settings.autoSaveToReparse, settings.autoSaveDelay]
  );

  const findTokenAtPosition = useCallback(
    (line, column) => {
      if (!parseResult?.tokens) return -1;
      const tokens = parseResult.tokens;
      
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.line === line) {
          const tokenEnd = token.column + (token.value?.length || 1);
          if (column >= token.column && column < tokenEnd) {
            return i;
          }
        }
      }
      return -1;
    },
    [parseResult]
  );

  const handleUpdate = useCallback(
    (update) => {
      if (update.docChanged && activeTab) {
        const newContent = update.state.doc.toString();
        updateTabContent(activeTab.path, newContent);
        
        if (activeTab.name.endsWith(".tonto") && (settings.autoSaveToDisk || settings.autoSaveToReparse)) {
          debouncedAutoAction(newContent, activeTab.path);
        }
      }

      if (update.selectionSet && parseResult?.tokens && !activeTab.isDirty) {
        if (tokenSyncDebounceRef.current) {
          clearTimeout(tokenSyncDebounceRef.current);
        }
        
        const pos = update.state.selection.main.head;
        const doc = update.state.doc;
        
        tokenSyncDebounceRef.current = setTimeout(() => {
          const line = doc.lineAt(pos);
          const lineNum = line.number;
          const column = pos - line.from + 1;
          
          const tokenIndex = findTokenAtPosition(lineNum, column);
          setSelectedTokenIndex(tokenIndex >= 0 ? tokenIndex : null);
          
          if (tokenIndex >= 0) {
            setAnalysisView("tokens");
          }
        }, 100);
      } else if (update.selectionSet && activeTab?.isDirty) {
        if (tokenSyncDebounceRef.current) {
          clearTimeout(tokenSyncDebounceRef.current);
        }
        setSelectedTokenIndex(null);
      }
    },
    [activeTab, updateTabContent, debouncedAutoAction, parseResult, findTokenAtPosition, setSelectedTokenIndex, setAnalysisView, settings.autoSaveToDisk, settings.autoSaveToReparse]
  );

  const handleSave = useCallback(() => {
    if (activeTab?.isDirty) {
      saveTab(activeTab.path);
    }
    return true;
  }, [activeTab, saveTab]);

  useEffect(() => {
    if (!viewRef.current || !parseResult) return;

    const errorLines = (parseResult.errors || [])
      .filter((e) => typeof e.line === "number" && e.line > 0)
      .map((e) => e.line);

    viewRef.current.dispatch({
      effects: setErrorLinesEffect.of({
        errorLines,
        doc: viewRef.current.state.doc,
      }),
    });
  }, [parseResult]);

  useEffect(() => {
    if (!viewRef.current || !highlightRequest) return;

    const { line, column, length, type } = highlightRequest;
    const doc = viewRef.current.state.doc;

    if (line < 1 || line > doc.lines) {
      setHighlightRequest(null);
      return;
    }

    const lineInfo = doc.line(line);
    const lineLength = lineInfo.to - lineInfo.from;
    
    const safeColumn = Math.max(1, Math.min(column || 1, lineLength + 1));
    const from = Math.min(lineInfo.from + (safeColumn - 1), lineInfo.to);
    const to = Math.min(from + (length || 1), lineInfo.to);

    viewRef.current.dispatch({
      selection: { anchor: from, head: to },
      scrollIntoView: true,
      effects: setHighlightEffect.of({ from, to, type }),
    });

    viewRef.current.focus();

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    const shouldKeepHighlight = settings.keepTokenHighlight && type === "token";
    if (!shouldKeepHighlight) {
      highlightTimeoutRef.current = setTimeout(() => {
        if (viewRef.current) {
          viewRef.current.dispatch({
            effects: clearHighlightEffect.of(null),
          });
        }
      }, 1500);
    }

    setHighlightRequest(null);
  }, [highlightRequest, setHighlightRequest, settings.keepTokenHighlight]);

  useEffect(() => {
    if (!editorRef.current || !activeTab) return;

    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const highlightStyle = createHighlightStyle(theme);
    const editorTheme = createEditorTheme(theme);

    const state = EditorState.create({
      doc: activeTab.content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        tontoLanguage,
        syntaxHighlighting(highlightStyle),
        editorTheme,
        errorLinesField,
        highlightField,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          { key: "Mod-s", run: handleSave },
        ]),
        EditorView.updateListener.of(handleUpdate),
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    if (parseResult?.errors) {
      const errorLines = parseResult.errors
        .filter((e) => e.line)
        .map((e) => e.line);

      viewRef.current.dispatch({
        effects: setErrorLinesEffect.of({
          errorLines,
          doc: viewRef.current.state.doc,
        }),
      });
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      if (tokenSyncDebounceRef.current) {
        clearTimeout(tokenSyncDebounceRef.current);
      }
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [activeTab?.path, theme]);

  useEffect(() => {
    if (viewRef.current) {
      window.__tontoEditorView = viewRef.current;
    }
    return () => {
      delete window.__tontoEditorView;
    };
  }, [viewRef.current]);

  if (!activeTab) return null;

  return <div ref={editorRef} className="code-editor" />;
}
