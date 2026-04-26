import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import type { Theme } from "@/types/waffles";

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function AppHeader({ theme, onToggleTheme, searchQuery, onSearchChange }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-background z-50 flex-shrink-0 gap-3">
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-fit">
        <WafflesLogo theme={theme} />
        <span className="font-semibold text-base tracking-tight">Вафельки</span>
      </div>

      {/* Search */}
      <div className={`flex items-center gap-1 transition-all duration-200 ${searchOpen ? "flex-1 max-w-xs" : ""}`}>
        {searchOpen ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              autoFocus
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Поиск по заметкам..."
              className="h-7 text-xs bg-muted border-border"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={() => { setSearchOpen(false); onSearchChange(""); }}
            >
              <Icon name="X" size={14} />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Icon name="Search" size={15} />
          </Button>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 min-w-fit">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        >
          <Icon name={theme === "dark" ? "Sun" : "Moon"} size={15} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-3 text-xs border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Icon name="User" size={13} className="mr-1.5" />
          Войти
        </Button>
      </div>
    </header>
  );
}

function WafflesLogo({ theme }: { theme: Theme }) {
  const color = theme === "dark" ? "#a78bfa" : "#ef4444";
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="9" height="9" rx="2.5" fill={color} opacity="0.9" />
      <rect x="12" y="1" width="9" height="9" rx="2.5" fill={color} opacity="0.55" />
      <rect x="1" y="12" width="9" height="9" rx="2.5" fill={color} opacity="0.55" />
      <rect x="12" y="12" width="9" height="9" rx="2.5" fill={color} opacity="0.3" />
    </svg>
  );
}
