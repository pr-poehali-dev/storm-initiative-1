export type Theme = "dark" | "light";

export interface Note {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  x: number;
  y: number;
  tags?: string[];
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

export interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
  expanded: boolean;
  parentId?: string;
}

export interface Project {
  id: string;
  name: string;
  topics: TreeNode[];
}

/** Рабочая область конкретного узла (проекта или темы) */
export interface CanvasData {
  notes: Note[];
  connections: Connection[];
  offset: { x: number; y: number };
  scale: number;
}

export interface AppState {
  theme: Theme;
  projects: Project[];
  activeProjectId: string | null;
  activeTopicId: string | null;
  /** Словарь: canvasId → данные рабочей области */
  canvases: Record<string, CanvasData>;
  searchQuery: string;
  connectingFromId: string | null;
  selectedNoteId: string | null;
  isDeletingNote: boolean;
  isDeletingConnection: boolean;
}
