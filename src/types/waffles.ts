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
  projectId?: string;
  topicId?: string;
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

export interface AppState {
  theme: Theme;
  projects: Project[];
  activeProjectId: string | null;
  activeTopicId: string | null;
  notes: Note[];
  connections: Connection[];
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  searchQuery: string;
  connectingFromId: string | null;
  selectedNoteId: string | null;
  isDeletingNote: boolean;
  isDeletingConnection: boolean;
}
