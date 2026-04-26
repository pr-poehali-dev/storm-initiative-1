import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import type { Note } from "@/types/waffles";

interface Props {
  note: Note;
  isSelected: boolean;
  isConnecting: boolean;
  isDeletingNote: boolean;
  isDeletingConnection: boolean;
  canvasScale: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onUpdate: (id: string, changes: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onConnectStart: (id: string) => void;
  onConnectEnd: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function NoteCard({
  note, isSelected, isConnecting, isDeletingNote, isDeletingConnection,
  canvasScale, onSelect, onMove, onUpdate, onDelete, onDuplicate,
  onConnectStart, onConnectEnd, onTogglePin,
}: Props) {
  const [editing, setEditing] = useState<"title" | "content" | null>(null);
  const [dragState, setDragState] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; nx: number; ny: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isPinned = !!note.pinned;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input, label")) return;
    // Закреплённые — запрет удаления и перемещения
    if (isDeletingNote) {
      if (!isPinned) onDelete(note.id);
      return;
    }
    if (isDeletingConnection) return;
    if (isConnecting) { onConnectEnd(note.id); return; }
    e.preventDefault();
    onSelect(note.id);
    // Закреплённые нельзя перемещать
    if (isPinned) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, nx: note.x, ny: note.y };

    const onMove_ = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (ev.clientX - dragStart.current.mx) / canvasScale;
      const dy = (ev.clientY - dragStart.current.my) / canvasScale;
      if (!dragState && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) setDragState(true);
      onMove(note.id, dragStart.current.nx + dx, dragStart.current.ny + dy);
    };
    const onUp = () => {
      dragStart.current = null;
      setDragState(false);
      window.removeEventListener("mousemove", onMove_);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove_);
    window.addEventListener("mouseup", onUp);
  }, [note.id, note.x, note.y, isPinned, isDeletingNote, isDeletingConnection, isConnecting, canvasScale, dragState, onDelete, onConnectEnd, onSelect, onMove]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      onUpdate(note.id, { imageUrl: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  }, [note.id, onUpdate]);

  const accentBorder = isSelected ? "ring-1 ring-primary/60" : "";
  const connectingStyle = isConnecting ? "ring-2 ring-primary animate-pulse cursor-crosshair" : "";
  // Закреплённые в режиме удаления — красная рамка с замком
  const deletingStyle = isDeletingNote && !isPinned
    ? "ring-2 ring-destructive/70 cursor-pointer hover:ring-destructive"
    : isDeletingNote && isPinned
    ? "ring-2 ring-muted/50 opacity-60 cursor-not-allowed"
    : "";
  // Курсор: закреплённые не перетаскиваются
  const cursorClass = isPinned ? "cursor-default" : "";

  return (
    <div
      ref={cardRef}
      className={`note-card fade-in bg-card border rounded-xl shadow-lg ${isPinned ? "border-primary/40" : "border-border"} ${accentBorder} ${connectingStyle} ${deletingStyle} ${dragState ? "dragging" : ""} ${cursorClass}`}
      style={{ left: note.x, top: note.y, width: 260 }}
      onMouseDown={handleMouseDown}
    >
      {/* Card header */}
      <div className="relative flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 pr-16">
        {/* Pin button — всегда видна, чётко показывает состояние */}
        <button
          className={`flex-shrink-0 transition-colors ${isPinned ? "text-primary opacity-100" : "opacity-30 hover:opacity-70 text-muted-foreground"}`}
          onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
          title={isPinned ? "Открепить (сейчас закреплена)" : "Закрепить заметку"}
        >
          <Icon name={isPinned ? "Pin" : "Pin"} size={13} />
        </button>

        {editing === "title" ? (
          <input
            autoFocus
            className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none border-b border-primary/40 pb-0.5"
            value={note.title}
            onChange={e => onUpdate(note.id, { title: e.target.value })}
            onBlur={() => setEditing(null)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditing(null); }}
          />
        ) : (
          <span
            className="flex-1 min-w-0 text-sm font-semibold truncate cursor-text"
            onDoubleClick={() => setEditing("title")}
            title="Дважды щёлкните для редактирования"
          >
            {note.title || "Без названия"}
          </span>
        )}

        {/* Кнопки действий — absolute, не влияют на ширину */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-opacity"
          style={{ opacity: isSelected ? 1 : 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = isSelected ? "1" : "0"; }}
        >
          <button
            className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={e => { e.stopPropagation(); onDuplicate(note.id); }}
            title="Дублировать"
          >
            <Icon name="Copy" size={11} />
          </button>
          <button
            className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={e => { e.stopPropagation(); onConnectStart(note.id); }}
            title="Создать связь"
          >
            <Icon name="GitFork" size={11} />
          </button>
          {/* Удаление — недоступно для закреплённых */}
          <button
            className={`h-5 w-5 flex items-center justify-center rounded ${isPinned ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}
            onClick={e => {
              e.stopPropagation();
              if (!isPinned) onDelete(note.id);
            }}
            title={isPinned ? "Сначала открепите заметку" : "Удалить"}
            disabled={isPinned}
          >
            <Icon name="X" size={11} />
          </button>
        </div>
      </div>

      {/* Закреплена — бейдж */}
      {isPinned && (
        <div className="mx-3 mb-1 flex items-center gap-1 text-[10px] text-primary/70">
          <Icon name="Pin" size={9} />
          <span>Закреплена · перемещение и удаление заблокированы</span>
        </div>
      )}

      {/* Content */}
      <div className="px-3 pb-2">
        {editing === "content" ? (
          <textarea
            autoFocus
            className="w-full bg-transparent text-xs text-muted-foreground outline-none resize-none leading-relaxed border border-border/50 rounded p-1"
            rows={5}
            value={note.content}
            onChange={e => onUpdate(note.id, { content: e.target.value })}
            onBlur={() => setEditing(null)}
            onKeyDown={e => { if (e.key === "Escape") setEditing(null); }}
          />
        ) : (
          <p
            className="text-xs text-muted-foreground leading-relaxed cursor-text min-h-[36px] whitespace-pre-wrap break-words"
            onDoubleClick={() => setEditing("content")}
          >
            {note.content || <span className="opacity-40 italic">Дважды щёлкните для добавления текста...</span>}
          </p>
        )}
      </div>

      {/* Image */}
      {note.imageUrl && (
        <div className="px-3 pb-2 relative group/img">
          <img
            src={note.imageUrl}
            alt="Прикреплённое изображение"
            className="w-full rounded-lg object-cover max-h-40 border border-border/50"
          />
          <button
            className="absolute top-3 right-4 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-destructive/20 text-destructive"
            onClick={e => { e.stopPropagation(); onUpdate(note.id, { imageUrl: undefined }); }}
          >
            <Icon name="X" size={10} />
          </button>
        </div>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {note.tags.map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/50">
        <label
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
          title="Прикрепить изображение"
        >
          <Icon name="Image" size={11} />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          Фото
        </label>
        <span className="text-[10px] text-muted-foreground/50">
          {new Date(note.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
        </span>
      </div>
    </div>
  );
}
