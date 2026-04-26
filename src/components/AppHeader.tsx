import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-background z-50 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-fit">
          <WafflesLogo theme={theme} />
          <span className="font-semibold text-base tracking-tight">Вафельки</span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Search — раскрывается влево */}
          {searchOpen ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Поиск по заметкам..."
                className="h-7 w-44 text-xs bg-muted border-border"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 text-muted-foreground"
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
              title="Поиск"
            >
              <Icon name="Search" size={15} />
            </Button>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          >
            <Icon name={theme === "dark" ? "Sun" : "Moon"} size={15} />
          </Button>

          {/* Auth */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs ml-1 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => setAuthOpen(true)}
          >
            <Icon name="User" size={13} className="mr-1.5" />
            Войти
          </Button>
        </div>
      </header>

      {/* Auth modal */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <WafflesLogo theme={theme} />
              {authMode === "login" ? "Вход в Вафельки" : "Регистрация"}
            </DialogTitle>
          </DialogHeader>

          <form
            className="space-y-3 pt-1"
            onSubmit={e => { e.preventDefault(); /* подключить бэкенд */ }}
          >
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-8 text-sm bg-muted border-border"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8 text-sm bg-muted border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-8 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {authMode === "login" ? "Войти" : "Создать аккаунт"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {authMode === "login" ? (
                <>Нет аккаунта?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setAuthMode("register")}
                  >
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setAuthMode("login")}
                  >
                    Войти
                  </button>
                </>
              )}
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
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
