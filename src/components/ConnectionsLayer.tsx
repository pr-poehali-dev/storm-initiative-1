import type { Note, Connection } from "@/types/waffles";

interface Props {
  notes: Note[];
  connections: Connection[];
  isDeletingConnection: boolean;
  onDeleteConnection: (id: string) => void;
}

export function ConnectionsLayer({ notes, connections, isDeletingConnection, onDeleteConnection }: Props) {
  const getNoteCenter = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return null;
    return { x: note.x + 130, y: note.y + 50 };
  };

  return (
    <svg
      className="connections-layer"
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: isDeletingConnection ? "all" : "none", overflow: "visible" }}
    >
      <defs>
        <marker id="arrowhead-dark" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" opacity="0.7" />
        </marker>
      </defs>
      {connections.map(conn => {
        const from = getNoteCenter(conn.fromId);
        const to = getNoteCenter(conn.toId);
        if (!from || !to) return null;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const cx1 = from.x + dx * 0.4;
        const cy1 = from.y;
        const cx2 = to.x - dx * 0.4;
        const cy2 = to.y;
        const path = `M ${from.x} ${from.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${to.x} ${to.y}`;

        return (
          <g key={conn.id}>
            {/* Hit area */}
            <path
              d={path}
              stroke="transparent"
              strokeWidth={12}
              fill="none"
              style={{ cursor: isDeletingConnection ? "pointer" : "default", pointerEvents: isDeletingConnection ? "all" : "none" }}
              onClick={() => isDeletingConnection && onDeleteConnection(conn.id)}
            />
            {/* Visual line */}
            <path
              d={path}
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              fill="none"
              opacity={0.5}
              markerEnd="url(#arrowhead-dark)"
              strokeDasharray={isDeletingConnection ? "5 3" : "none"}
              style={{ pointerEvents: "none" }}
            />
          </g>
        );
      })}
    </svg>
  );
}
