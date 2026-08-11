declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideApi>;
  }
}

type PyodideApi = {
  runPythonAsync: (source: string) => Promise<unknown>;
  setStdout: (options: { batched: (message: string) => void }) => void;
  setStderr: (options: { batched: (message: string) => void }) => void;
  globals: {
    set: (name: string, value: unknown) => void;
    get: (name: string) => unknown;
  };
  loadPackage?: (packages: string | string[]) => Promise<void>;
};

let pyodidePromise: Promise<PyodideApi> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-pyodide="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      if (existing.dataset.loaded === "true") {
        resolve();
      }
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.pyodide = src;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
    document.head.appendChild(script);
  });
}

function countPrintOccurrences(source: string): number {
  return source.split("print(").length - 1;
}

export async function getPyodide(): Promise<PyodideApi> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const indexURL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
      await loadScript(`${indexURL}pyodide.js`);
      if (!window.loadPyodide) {
        throw new Error("Pyodide loader did not initialize.");
      }
      const api = await window.loadPyodide({ indexURL });
      return api;
    })();
  }
  return pyodidePromise;
}

export type RunPythonResult = {
  ok: boolean;
  output: string;
  printStatementCount: number;
  error?: string;
};

export async function runPythonSource(source: string): Promise<RunPythonResult> {
  const pyodide = await getPyodide();
  let stdout = "";
  let stderr = "";
  pyodide.setStdout({
    batched: (message) => {
      stdout += message;
    }
  });
  pyodide.setStderr({
    batched: (message) => {
      stderr += message;
    }
  });
  pyodide.globals.set("USER_SOURCE", source);
  try {
    const resultJson = (await pyodide.runPythonAsync(`
import ast
import contextlib
import io
import json
import traceback

source = USER_SOURCE
stdout_buffer = io.StringIO()
stderr_buffer = io.StringIO()

try:
    tree = ast.parse(source)
    print_calls = sum(
        1
        for node in ast.walk(tree)
        if isinstance(node, ast.Call) and getattr(node.func, "id", None) == "print"
    )
except Exception:
    print_calls = source.count("print(")

ok = False
error = ""
with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
    try:
        exec(compile(source, "<drill>", "exec"), {})
        ok = True
    except Exception:
        error = traceback.format_exc()

json.dumps({
    "ok": ok,
    "print_statement_count": print_calls,
    "stdout": stdout_buffer.getvalue(),
    "stderr": stderr_buffer.getvalue(),
    "error": error,
})
    `)) as {
      ok: boolean;
      print_statement_count: number;
      stdout: string;
      stderr: string;
      error: string;
    } | string;
    const result = JSON.parse(String(resultJson)) as {
      ok: boolean;
      print_statement_count: number;
      stdout: string;
      stderr: string;
      error: string;
    };
    const combined = `${stdout}${result.stdout}${stderr}${result.stderr}`.trimEnd();
    return {
      ok: result.ok,
      output: combined,
      printStatementCount: result.print_statement_count,
      error: result.error || undefined
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      output: `${stdout}${stderr}`.trimEnd(),
      printStatementCount: countPrintOccurrences(source),
      error: message
    };
  }
}
