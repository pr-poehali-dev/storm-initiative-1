import { useState, useCallback, useEffect } from "react";
import type { AppState, Note, Connection, Project, TreeNode, Theme } from "@/types/waffles";

const STORAGE_KEY = "waffles-state";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        connectingFromId: null,
        selectedNoteId: null,
        isDeletingNote: false,
        isDeletingConnection: false,
        searchQuery: "",
      };
    }
  } catch (_e) { /* ignore */ }
  return {
    theme: "dark",
    projects: [],
    activeProjectId: null,
    activeTopicId: null,
    notes: [],
    connections: [],
    canvasOffset: { x: 0, y: 0 },
    canvasScale: 1,
    searchQuery: "",
    connectingFromId: null,
    selectedNoteId: null,
    isDeletingNote: false,
    isDeletingConnection: false,
  };
}

export function useWafflesState() {
  const [state, setState] = useState<AppState>(getInitialState);

  useEffect(() => {
    const { connectingFromId, selectedNoteId, isDeletingNote, isDeletingConnection, searchQuery, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
  }, [state.theme]);

  const toggleTheme = useCallback(() => {
    setState(s => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }));
  }, []);

  // Projects
  const addProject = useCallback((name: string) => {
    const project: Project = { id: generateId(), name, topics: [] };
    setState(s => ({
      ...s,
      projects: [...s.projects, project],
      activeProjectId: project.id,
      activeTopicId: null,
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState(s => ({
      ...s,
      projects: s.projects.filter(p => p.id !== id),
      activeProjectId: s.activeProjectId === id ? (s.projects[0]?.id ?? null) : s.activeProjectId,
      notes: s.notes.filter(n => n.projectId !== id),
    }));
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p => p.id === id ? { ...p, name } : p),
    }));
  }, []);

  // Topics (tree nodes)
  function addTopicToList(topics: TreeNode[], parentId: string | null, newNode: TreeNode): TreeNode[] {
    if (!parentId) return [...topics, newNode];
    return topics.map(t => {
      if (t.id === parentId) return { ...t, children: [...t.children, newNode], expanded: true };
      return { ...t, children: addTopicToList(t.children, parentId, newNode) };
    });
  }

  function removeTopicFromList(topics: TreeNode[], id: string): TreeNode[] {
    return topics
      .filter(t => t.id !== id)
      .map(t => ({ ...t, children: removeTopicFromList(t.children, id) }));
  }

  function toggleTopicExpand(topics: TreeNode[], id: string): TreeNode[] {
    return topics.map(t => {
      if (t.id === id) return { ...t, expanded: !t.expanded };
      return { ...t, children: toggleTopicExpand(t.children, id) };
    });
  }

  const addTopic = useCallback((projectId: string, parentId: string | null, name: string) => {
    const node: TreeNode = { id: generateId(), name, children: [], expanded: true, parentId: parentId ?? undefined };
    setState(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === projectId ? { ...p, topics: addTopicToList(p.topics, parentId, node) } : p
      ),
      activeTopicId: node.id,
    }));
  }, []);

  const deleteTopic = useCallback((projectId: string, topicId: string) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === projectId ? { ...p, topics: removeTopicFromList(p.topics, topicId) } : p
      ),
      activeTopicId: s.activeTopicId === topicId ? null : s.activeTopicId,
    }));
  }, []);

  const toggleTopic = useCallback((projectId: string, topicId: string) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === projectId ? { ...p, topics: toggleTopicExpand(p.topics, topicId) } : p
      ),
    }));
  }, []);

  const setActiveProject = useCallback((id: string) => {
    setState(s => ({ ...s, activeProjectId: id, activeTopicId: null }));
  }, []);

  const setActiveTopic = useCallback((id: string) => {
    setState(s => ({ ...s, activeTopicId: id }));
  }, []);

  // Notes
  const addNote = useCallback(() => {
    setState(s => {
      const note: Note = {
        id: generateId(),
        title: "Новая заметка",
        content: "",
        x: 80 + Math.random() * 200,
        y: 80 + Math.random() * 200,
        tags: [],
        pinned: false,
        projectId: s.activeProjectId ?? undefined,
        topicId: s.activeTopicId ?? undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return { ...s, notes: [...s.notes, note], selectedNoteId: note.id };
    });
  }, []);

  const updateNote = useCallback((id: string, changes: Partial<Note>) => {
    setState(s => ({
      ...s,
      notes: s.notes.map(n =>
        n.id === id ? { ...n, ...changes, updatedAt: Date.now() } : n
      ),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState(s => ({
      ...s,
      notes: s.notes.filter(n => n.id !== id),
      connections: s.connections.filter(c => c.fromId !== id && c.toId !== id),
      selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
      isDeletingNote: false,
    }));
  }, []);

  const duplicateNote = useCallback((id: string) => {
    setState(s => {
      const src = s.notes.find(n => n.id === id);
      if (!src) return s;
      const copy: Note = { ...src, id: generateId(), x: src.x + 30, y: src.y + 30, createdAt: Date.now(), updatedAt: Date.now() };
      return { ...s, notes: [...s.notes, copy] };
    });
  }, []);

  const moveNote = useCallback((id: string, x: number, y: number) => {
    setState(s => ({
      ...s,
      notes: s.notes.map(n => n.id === id ? { ...n, x, y } : n),
    }));
  }, []);

  // Connections
  const addConnection = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setState(s => {
      const exists = s.connections.some(
        c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId)
      );
      if (exists) return { ...s, connectingFromId: null };
      const conn: Connection = { id: generateId(), fromId, toId };
      return { ...s, connections: [...s.connections, conn], connectingFromId: null };
    });
  }, []);

  const deleteConnection = useCallback((id: string) => {
    setState(s => ({
      ...s,
      connections: s.connections.filter(c => c.id !== id),
      isDeletingConnection: false,
    }));
  }, []);

  // Canvas
  const setCanvasOffset = useCallback((offset: { x: number; y: number }) => {
    setState(s => ({ ...s, canvasOffset: offset }));
  }, []);

  const setCanvasScale = useCallback((scale: number) => {
    setState(s => ({ ...s, canvasScale: Math.min(2, Math.max(0.25, scale)) }));
  }, []);

  // UI state
  const setConnectingFrom = useCallback((id: string | null) => {
    setState(s => ({ ...s, connectingFromId: id, isDeletingNote: false, isDeletingConnection: false }));
  }, []);

  const setSelectedNote = useCallback((id: string | null) => {
    setState(s => ({ ...s, selectedNoteId: id }));
  }, []);

  const setDeletingNote = useCallback((v: boolean) => {
    setState(s => ({ ...s, isDeletingNote: v, connectingFromId: null, isDeletingConnection: false }));
  }, []);

  const setDeletingConnection = useCallback((v: boolean) => {
    setState(s => ({ ...s, isDeletingConnection: v, connectingFromId: null, isDeletingNote: false }));
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    setState(s => ({ ...s, searchQuery: q }));
  }, []);

  return {
    state,
    toggleTheme,
    addProject,
    deleteProject,
    renameProject,
    addTopic,
    deleteTopic,
    toggleTopic,
    setActiveProject,
    setActiveTopic,
    addNote,
    updateNote,
    deleteNote,
    duplicateNote,
    moveNote,
    addConnection,
    deleteConnection,
    setCanvasOffset,
    setCanvasScale,
    setConnectingFrom,
    setSelectedNote,
    setDeletingNote,
    setDeletingConnection,
    setSearchQuery,
  };
}