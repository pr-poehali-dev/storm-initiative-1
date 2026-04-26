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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input, label")) return;
    if (isDeletingNote) { onDelete(note.id); return; }
    if (isDeletingConnection) return;
    if (isConnecting) { onConnectEnd(note.id); return; }
    e.preventDefault();
    onSelect(note.id);
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
  }, [note.id, note.x, note.y, isDeletingNote, isDeletingConnection, isConnecting, canvasScale, dragState, onDelete, onConnectEnd, onSelect, onMove]);

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
  const deletingStyle = isDeletingNote ? "ring-2 ring-destructive/70 cursor-pointer hover:ring-destructive" : "";

  return (
    <div
      ref={cardRef}
      className={`note-card fade-in bg-card border border-border rounded-xl shadow-lg ${accentBorder} ${connectingStyle} ${deletingStyle} ${dragState ? "dragging" : ""}`}
      style={{ left: note.x, top: note.y, width: 260 }}
      onMouseDown={handleMouseDown}
    >
      {/* Card header */}
      <div className="relative flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 pr-16">
        <button
          className="flex-shrink-0 opacity-40 hover:opacity-80"
          onClick={() => onTogglePin(note.id)}
          title={note.pinned ? "Открепить" : "Закрепить"}
        >
          <Icon name={note.pinned ? "Pin" : "PinOff"} size={12} className={note.pinned ? "text-primary" : ""} />
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

        {/* Кнопки вынесены в absolute, чтобы не влиять на ширину карточки */}
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
          <button
            className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={e => { e.stopPropagation(); onDelete(note.id); }}
            title="Удалить"
          >
            <Icon name="X" size={11} />
          </button>
        </div>
      </div>

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