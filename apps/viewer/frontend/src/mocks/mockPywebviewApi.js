/**
 * Mock implementation of window.pywebview.api for development mode.
 * Allows testing the React frontend without the Python backend.
 *
 * Usage:
 *   - Run `npm run dev` and the mock will be automatically injected
 *   - Switch scenarios: window.setMockScenario('consultaMedica') or window.setMockScenario('carOwnership')
 *   - Get current scenario: window.getMockScenario()
 */

import { mockScenarios, defaultScenario } from "./mockData";

// Current active scenario
let currentScenario = defaultScenario;

/**
 * Get the current mock data based on active scenario
 */
function getCurrentMockData() {
  return mockScenarios[currentScenario];
}

/**
 * Mock implementation of the PyWebView API
 */
export const mockApi = {
  /**
   * Mock folder selection - returns a fake path
   */
  select_folder: async () => {
    console.log("[Mock API] select_folder called");
    return "/mock/project";
  },

  /**
   * Mock directory listing - returns a minimal file tree
   */
  list_directory: async (path) => {
    console.log("[Mock API] list_directory:", path);

    // Return a simple mock file tree
    if (path === "/mock/project") {
      return [
        {
          name: "src",
          path: "/mock/project/src",
          type: "directory",
          extension: "",
        },
      ];
    }

    if (path === "/mock/project/src") {
      let filename;
      switch (currentScenario) {
        case "consultaMedica":
          filename = "ConsultaMedica.tonto";
          break;
        case "carOwnership":
          filename = "example2.tonto";
          break;
        case "coberturaPizza":
          filename = "Cobertura_Da_Pizza.tonto";
          break;
        case "carRental":
          filename = "carRental.tonto";
          break;
        default:
          filename = "example.tonto";
      }

      return [
        {
          name: filename,
          path: `/mock/project/src/${filename}`,
          type: "file",
          extension: ".tonto",
        },
      ];
    }

    return [];
  },

  /**
   * Mock file reading - returns the content from current scenario
   */
  read_file: async (path) => {
    console.log("[Mock API] read_file:", path);

    if (path.endsWith(".tonto")) {
      const mockData = getCurrentMockData();
      return mockData.content;
    }

    return null;
  },

  /**
   * Mock file writing - just logs and returns success
   */
  write_file: async (path, content) => {
    console.log("[Mock API] write_file:", path, "content length:", content.length);
    return true;
  },

  /**
   * Mock content parsing - returns the pre-parsed AST from current scenario
   */
  parse_content: async (content) => {
    console.log("[Mock API] parse_content called, content length:", content.length);

    const mockData = getCurrentMockData();

    // Return the full parse result structure
    return {
      tokens: [], // We don't need tokens for diagram testing
      ast: mockData.ast,
      semantic: mockData.semantic,
      errors: [],
      warnings: mockData.warnings || [],
    };
  },
};

/**
 * Switch between mock scenarios
 * @param {string} scenarioName - 'consultaMedica', 'carOwnership', or 'coberturaPizza'
 */
export function setMockScenario(scenarioName) {
  if (!mockScenarios[scenarioName]) {
    console.error(
      `[Mock API] Unknown scenario: ${scenarioName}. Available: ${Object.keys(mockScenarios).join(", ")}`
    );
    return false;
  }

  currentScenario = scenarioName;
  console.log(`[Mock API] Switched to scenario: ${scenarioName}`);
  console.log("[Mock API] Reload the page or re-open the file to see changes");
  return true;
}

/**
 * Get the current scenario name
 */
export function getMockScenario() {
  return currentScenario;
}

/**
 * List available scenarios
 */
export function listMockScenarios() {
  return Object.keys(mockScenarios);
}

/**
 * Initialize the mock API on window.pywebview
 */
export function initializeMockApi() {
  if (window.pywebview) {
    console.log("[Mock API] pywebview already exists, skipping mock initialization");
    return false;
  }

  window.pywebview = { api: mockApi };

  // Expose helper functions on window for easy console access
  window.setMockScenario = setMockScenario;
  window.getMockScenario = getMockScenario;
  window.listMockScenarios = listMockScenarios;

  console.log("[Mock API] Initialized mock pywebview API");
  console.log(`[Mock API] Current scenario: ${currentScenario}`);
  console.log("[Mock API] Available scenarios:", listMockScenarios());
  console.log("[Mock API] Switch with: window.setMockScenario('scenarioName')");

  return true;
}
