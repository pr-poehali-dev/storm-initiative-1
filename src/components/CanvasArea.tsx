import { useRef, useCallback, useState } from "react";
import { NoteCard } from "@/components/NoteCard";
import { ConnectionsLayer } from "@/components/ConnectionsLayer";
import type { Note, Connection } from "@/types/waffles";

interface Props {
  notes: Note[];
  connections: Connection[];
  selectedNoteId: string | null;
  connectingFromId: string | null;
  isDeletingNote: boolean;
  isDeletingConnection: boolean;
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  searchQuery: string;
  onSelectNote: (id: string) => void;
  onMoveNote: (id: string, x: number, y: number) => void;
  onUpdateNote: (id: string, changes: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onConnectStart: (id: string) => void;
  onConnectEnd: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteConnection: (id: string) => void;
  onOffsetChange: (offset: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
  onCanvasClick: () => void;
}

export function CanvasArea({
  notes, connections, selectedNoteId, connectingFromId, isDeletingNote, isDeletingConnection,
  canvasOffset, canvasScale, searchQuery,
  onSelectNote, onMoveNote, onUpdateNote, onDeleteNote, onDuplicateNote,
  onConnectStart, onConnectEnd, onTogglePin, onDeleteConnection,
  onOffsetChange, onScaleChange, onCanvasClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const filteredNotes = searchQuery
    ? notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notes;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".note-card")) return;
    if (e.button !== 0) return;
    panStart.current = { mx: e.clientX, my: e.clientY, ox: canvasOffset.x, oy: canvasOffset.y };
    setIsPanning(true);

    const onMove = (ev: MouseEvent) => {
      if (!panStart.current) return;
      onOffsetChange({
        x: panStart.current.ox + ev.clientX - panStart.current.mx,
        y: panStart.current.oy + ev.clientY - panStart.current.my,
      });
    };
    const onUp = () => {
      panStart.current = null;
      setIsPanning(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [canvasOffset, onOffsetChange]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    onScaleChange(canvasScale + delta);
  }, [canvasScale, onScaleChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".note-card")) return;
    onCanvasClick();
  }, [onCanvasClick]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative overflow-hidden canvas-grid ${isPanning ? "cursor-grabbing" : connectingFromId ? "cursor-crosshair" : isDeletingNote ? "cursor-pointer" : "cursor-grab"}`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      {/* Hint */}
      {notes.length === 0 && !searchQuery && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="text-center opacity-25">
            <div className="text-4xl mb-3">🧇</div>
            <p className="text-sm font-medium">Рабочая область пуста</p>
            <p className="text-xs mt-1">Нажмите + справа чтобы добавить заметку</p>
          </div>
        </div>
      )}

      {/* Search no results */}
      {searchQuery && filteredNotes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="text-center opacity-30">
            <p className="text-sm">Ничего не найдено по «{searchQuery}»</p>
          </div>
        </div>
      )}

      {/* Transform container */}
      <div
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          transformOrigin: "0 0",
          position: "absolute",
          width: "4000px",
          height: "4000px",
        }}
      >
        <ConnectionsLayer
          notes={notes}
          connections={connections}
          isDeletingConnection={isDeletingConnection}
          onDeleteConnection={onDeleteConnection}
        />

        {filteredNotes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            isConnecting={connectingFromId !== null && connectingFromId !== note.id}
            isDeletingNote={isDeletingNote}
            isDeletingConnection={isDeletingConnection}
            canvasScale={canvasScale}
            onSelect={onSelectNote}
            onMove={onMoveNote}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            onDuplicate={onDuplicateNote}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/50 select-none pointer-events-none">
        {Math.round(canvasScale * 100)}%
      </div>

      {/* Connecting mode hint */}
      {connectingFromId && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          {connectingFromId === "__pending__"
            ? "Щёлкните на первую заметку (источник связи) · Esc для отмены"
            : "Щёлкните на вторую заметку для завершения связи · Esc для отмены"}
        </div>
      )}
      {isDeletingNote && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          Щёлкните на заметку для удаления · Esc для отмены
        </div>
      )}
      {isDeletingConnection && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          Щёлкните на связь для удаления · Esc для отмены
        </div>
      )}
    </div>
  );
}