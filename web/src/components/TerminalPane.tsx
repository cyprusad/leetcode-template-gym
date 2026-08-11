import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

type TerminalTheme = {
  background: string;
  foreground: string;
  cursor: string;
};

type TerminalPaneProps = {
  output: string;
  theme: TerminalTheme;
};

export function TerminalPane({ output, theme }: TerminalPaneProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!rootRef.current || terminalRef.current) {
      return;
    }
    const terminal = new Terminal({
      fontFamily: '"JetBrains Mono", "SFMono-Regular", ui-monospace, monospace',
      fontSize: 13,
      theme,
      convertEol: true,
      disableStdin: true
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(rootRef.current);
    fitAddon.fit();
    terminalRef.current = terminal;
    fitRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(rootRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitRef.current = null;
    };
  }, []);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }
    terminal.options.theme = theme;
    fitRef.current?.fit();
  }, [theme]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }
    terminal.clear();
    terminal.write(output.replace(/\n/g, "\r\n"));
    fitRef.current?.fit();
  }, [output]);

  return <div className="terminal-root" ref={rootRef} />;
}
