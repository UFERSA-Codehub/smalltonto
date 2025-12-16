// Light mode palette
export const light = {
  // Primary colors from specification
  text: "#060e0f",
  background: "#f3fafc",
  primary: "#0e8a9a",
  secondary: "#8ce3f2",
  accent: "#1a9fb2",

  // Derived shades for UI elements
  textSecondary: "#1a3035",
  textMuted: "#3a5a60",

  // Surfaces (derived from background)
  surface0: "#e5f4f8",
  surface1: "#d8eef4",
  surface2: "#cbe8f0",

  // Overlays
  overlay0: "#8ab0b8",
  overlay1: "#6a9098",
  overlay2: "#4a7078",

  // Semantic colors
  red: "#d32f2f",
  green: "#2e7d32",
  yellow: "#c77c00",
  orange: "#ef6c00",
  blue: "#0d47a1",
  purple: "#7b1fa2",
  pink: "#c2185b",
  teal: "#00796b",
  cyan: "#00695c",

  // Code syntax colors
  mauve: "#7b1fa2",
  peach: "#ef6c00",
  sky: "#00695c",
  sapphire: "#0288d1",
  lavender: "#5c6bc0",
};

// Dark mode palette
export const dark = {
  // Primary colors from specification
  text: "#f0f8f9",
  background: "#0a1214",
  primary: "#27bcd3",
  secondary: "#0d6373",
  accent: "#089ab4",

  // Derived shades for UI elements
  textSecondary: "#d0e5e8",
  textMuted: "#95c0c8",

  // Surfaces (derived from background) - increased contrast
  surface0: "#121e22",
  surface1: "#1a2a2e",
  surface2: "#243840",

  // Overlays - brighter for better visibility
  overlay0: "#4a6a72",
  overlay1: "#6a8a92",
  overlay2: "#8aaab2",

  // Semantic colors
  red: "#ef5350",
  green: "#66bb6a",
  yellow: "#d4940a",
  orange: "#ffa726",
  blue: "#42a5f5",
  purple: "#ab47bc",
  pink: "#ec407a",
  teal: "#26a69a",
  cyan: "#26c6da",

  // Code syntax colors
  mauve: "#ce93d8",
  peach: "#ffb74d",
  sky: "#4dd0e1",
  sapphire: "#4fc3f7",
  lavender: "#9fa8da",
};

export const getTheme = (isDark = false) => {
  const palette = isDark ? dark : light;

  return {
    background: palette.background,
    backgroundSecondary: isDark ? "#0e1a1e" : "#e8f5f9",
    backgroundTertiary: isDark ? "#141f24" : "#dceef4",

    surface: palette.surface0,
    surfaceHover: palette.surface1,
    surfaceActive: palette.surface2,

    text: palette.text,
    textSecondary: palette.textSecondary,
    textMuted: palette.textMuted,

    border: palette.surface1,
    borderHover: palette.surface2,

    // Code syntax highlighting
    keyword: palette.mauve,
    string: palette.green,
    number: palette.peach,
    comment: palette.overlay1,
    operator: palette.sky,
    type: palette.yellow,
    function: palette.blue,
    variable: palette.text,
    property: palette.lavender,

    // Semantic colors
    error: palette.red,
    warning: palette.yellow,
    success: palette.green,
    info: palette.blue,

    // Node colors for diagrams
    nodePackage: palette.primary,
    nodeClass: palette.accent,
    nodeRelation: palette.teal,
    nodeAttribute: palette.green,
    nodeDatatype: palette.orange,
    nodeEnum: palette.pink,
    nodeGenset: palette.cyan,

    // Primary actions
    primary: palette.primary,
    primaryHover: palette.accent,
    selection: isDark ? `${palette.primary}33` : `${palette.primary}22`,

    palette,
  };
};

export default { light, dark, getTheme };
