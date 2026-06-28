import { useEffect, useRef, useState } from "react";
import { THEMES, applyTheme, getStoredTheme, type Theme } from "../../lib/theme";

const SWATCH: Record<Theme, string> = {
  rose: "#c9958a",
  blush: "#d4756a",
  sage: "#4d8c60",
  midnight: "#7b9cff",
  champagne: "#b89050",
  lilac: "#7c54c8",
};

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className={`theme-dd${open ? " open" : ""}`} ref={ref}>
      <button className="theme-dd-btn" onClick={() => setOpen((v) => !v)} aria-label="Trocar tema">
        <span className="sw" style={{ background: SWATCH[theme] }} />
        <span className="nm">{theme}</span>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </button>
      <div className="theme-dd-menu" role="listbox">
        {THEMES.map((t) => (
          <button
            key={t}
            className={`theme-dd-opt${t === theme ? " active" : ""}`}
            onClick={() => {
              setTheme(t);
              setOpen(false);
            }}
          >
            <span className="sw" style={{ background: SWATCH[t] }} />
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export { SWATCH };
