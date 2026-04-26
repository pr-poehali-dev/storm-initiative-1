import { useState, useCallback, useEffect } from "react";
import type { AppState, Note, Connection, Project, TreeNode, CanvasData } from "@/types/waffles";

const STORAGE_KEY = "waffles-state-v2";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyCanvas(): CanvasData {
  return { notes: [], connections: [], offset: { x: 0, y: 0 }, scale: 1 };
}

function getInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        canvases: parsed.canvases ?? {},
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
    canvases: {},
    searchQuery: "",
    connectingFromId: null,
    selectedNoteId: null,
    isDeletingNote: false,
    isDeletingConnection: false,
  };
}

export function useWafflesState() {
  const [state, setState] = useState<AppState>(getInitialState);

  // Persist (без UI-состояния)
  useEffect(() => {
    const { connectingFromId, selectedNoteId, isDeletingNote, isDeletingConnection, searchQuery, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [state]);

  // Тема
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
  }, [state.theme]);

  // Вычисляем активный canvasId
  const getActiveCanvasId = useCallback((s: AppState): string | null => {
    return s.activeTopicId ?? s.activeProjectId;
  }, []);

  // Получаем данные текущего канваса
  const getActiveCanvas = useCallback((s: AppState): CanvasData => {
    const id = getActiveCanvasId(s);
    if (!id) return emptyCanvas();
    return s.canvases[id] ?? emptyCanvas();
  }, [getActiveCanvasId]);

  // Обновляем данные конкретного канваса
  function patchCanvas(s: AppState, canvasId: string, patch: Partial<CanvasData>): AppState {
    const current = s.canvases[canvasId] ?? emptyCanvas();
    return {
      ...s,
      canvases: {
        ...s.canvases,
        [canvasId]: { ...current, ...patch },
      },
    };
  }

  const toggleTheme = useCallback(() => {
    setState(s => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }));
  }, []);

  // ─── Projects ───────────────────────────────────────────────────────────────

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
    setState(s => {
      const remaining = s.projects.filter(p => p.id !== id);
      // Удаляем все канвасы этого проекта и его тем
      const deletedIds = new Set<string>([id]);
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach(n => { deletedIds.add(n.id); collectIds(n.children); });
      };
      const proj = s.projects.find(p => p.id === id);
      if (proj) collectIds(proj.topics);
      const newCanvases = { ...s.canvases };
      deletedIds.forEach(cid => { delete newCanvases[cid]; });
      return {
        ...s,
        projects: remaining,
        activeProjectId: s.activeProjectId === id ? (remaining[0]?.id ?? null) : s.activeProjectId,
        activeTopicId: deletedIds.has(s.activeTopicId ?? "") ? null : s.activeTopicId,
        canvases: newCanvases,
      };
    });
  }, []);

  // ─── Topics ─────────────────────────────────────────────────────────────────

  function addTopicToList(topics: TreeNode[], parentId: string | null, newNode: TreeNode): TreeNode[] {
    if (!parentId) return [...topics, newNode];
    return topics.map(t => {
      if (t.id === parentId) return { ...t, children: [...t.children, newNode], expanded: true };
      return { ...t, children: addTopicToList(t.children, parentId, newNode) };
    });
  }

  function removeTopicFromList(topics: TreeNode[], id: string): TreeNode[] {
    return topics.filter(t => t.id !== id).map(t => ({ ...t, children: removeTopicFromList(t.children, id) }));
  }

  function getAllTopicIds(nodes: TreeNode[]): string[] {
    return nodes.flatMap(n => [n.id, ...getAllTopicIds(n.children)]);
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
    setState(s => {
      const proj = s.projects.find(p => p.id === projectId);
      const deletedIds = new Set<string>();
      if (proj) {
        const findSubtree = (nodes: TreeNode[]): TreeNode | null => {
          for (const n of nodes) {
            if (n.id === topicId) return n;
            const found = findSubtree(n.children);
            if (found) return found;
          }
          return null;
        };
        const subtree = findSubtree(proj.topics);
        if (subtree) {
          const collectAll = (node: TreeNode) => {
            deletedIds.add(node.id);
            node.children.forEach(collectAll);
          };
          collectAll(subtree);
        }
      }
      const newCanvases = { ...s.canvases };
      deletedIds.forEach(cid => { delete newCanvases[cid]; });
      return {
        ...s,
        projects: s.projects.map(p =>
          p.id === projectId ? { ...p, topics: removeTopicFromList(p.topics, topicId) } : p
        ),
        activeTopicId: deletedIds.has(s.activeTopicId ?? "") ? null : s.activeTopicId,
        canvases: newCanvases,
      };
    });
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
    setState(s => ({ ...s, activeProjectId: id, activeTopicId: null, connectingFromId: null, selectedNoteId: null }));
  }, []);

  const setActiveTopic = useCallback((id: string) => {
    setState(s => ({ ...s, activeTopicId: id, connectingFromId: null, selectedNoteId: null }));
  }, []);

  // ─── Notes (работают с активным канвасом) ────────────────────────────────────

  const addNote = useCallback(() => {
    setState(s => {
      const canvasId = getActiveCanvasId(s);
      if (!canvasId) return s;
      const canvas = s.canvases[canvasId] ?? emptyCanvas();
      const note: Note = {
        id: generateId(),
        title: "Новая заметка",
        content: "",
        x: 80 + Math.random() * 200,
        y: 80 + Math.random() * 200,
        tags: [],
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...patchCanvas(s, canvasId, { notes: [...canvas.notes, note] }),
        selectedNoteId: note.id,
      };
    });
  }, [getActiveCanvasId]);

  const updateNote = useCallback((id: string, changes: Partial<Note>) => {
    setState(s => {
      const canvasId = getActiveCanvasId(s);
      if (!canvasId) return s;
      const canvas = s.canvases[canvasId] ?? emptyCanvas();
      return patchCanvas(s, canvasId, {
        notes: canvas.notes.map(n => n.id === id ? { ...n, ...changes, updatedAt: Date.now() } : n),
      });
    });
  }, [getActiveCanvasId]);

  const deleteNote = useCallback((id: string) => {
    setState(s => {
      const canvasId = getActiveCanvasId(s);
      if (!canvasId) return s;
      const canvas = s.canvases[canvasId] ?? emptyCanvas();
      return {
        ...patchCanvas(s, canvasId, {
          notes: canvas.notes.filter(n => n.id !== id),
          connections: canvas.connections.filter(c => c.fromId !== id && c.toId !== id),
        }),
        selectedNoteId: s.selectedNoteId === id ? null : s.selectedNoteId,
        isDeletingNote: false,
      };
    });
  }, [getActiveCanvasId]);

  const duplicateNote = useCallback((id: string) => {
    setState(s => {
      const canvasId = getActiveCanvasId(s);
      if (!canvasId) return s;
      const canvas = s.canvases[canvasId] ?? emptyCanvas();
      const src = canvas.notes.find(n => n.id === id);
      if (!src) return s;
      const copy: Note = { ...src, id: generateId(), x: src.x + 30, y: src.y + 30, createdAt: Date.now(), updatedAt: Date.now() };
      return patchCanvas(s, canvasId, { notes: [...canvas.notes, copy] });
    });
  }, [getActiveCanvasId]);

  const moveNote = useCallback((id: string, x: number, y: number) => {
    setState(s => {
      const canvasId = getActiveCanvasId(s);
      if (!canvasId) return s;
      const canvas = s.canvases[canvasId] ?? emptyCanvas();
      return patchCanvas(s, canvasId, {
        notes: canvas.notes.map(n => n.id === id ? { ...n, x, y } : n),
      });
    });
  }, [getActiveCanvasId]);

  // ─── Connections ─────────────────────────────────────────────────────────────

  const addConnection = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setState(s => {
      const canvasId = getActiveCanvasId(s);
      if (!canvasId) return { ...s, connectingFromId: null };
      const canvas = s.canvases[canvasId] ?? emptyCanvas();
      const exists = canvas.connections.some(
        c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId)
      );
      if (exists) return { ...s, connectingFromId: null };
      const conn: Connection = { id: generateId(), fromId, toId };
      return {
        ...patchCanvas(s, canvasId, { connections: [...canvas.connections, conn] }),
        connectingFromId: null,
      };
    });
  }, [getActiveCanvasId]);

  const deleteConnection = useCallback((id: string) => {
    setState(s => {
      const canvasId = getActiveCanvasId(s);
      if (!canvasId) return s;
      const canvas = s.canvases[canvasId] ?? emptyCanvas();
      return {
        ...patchCanvas(s, canvasId, {
          connections: canvas.connections.filter(c => c.id !== id),
        }),
        isDeletingConnection: false,
      };
    });
  }, [getActiveCanvasId]);

  // ─── Canvas view ─────────────────────────────────────────────────────────────

  const setCanvasOffset = useCallback((offset: { x: number; y: number }) => {
    setState(s => {
      const canvasId = getActiveCanvasId(s);
      if (!canvasId) return s;
      return patchCanvas(s, canvasId, { offset });
    });
  }, [getActiveCanvasId]);

  const setCanvasScale = useCallback((scale: number) => {
    setState(s => {
      const canvasId = getActiveCanvasId(s);
      if (!canvasId) return s;
      return patchCanvas(s, canvasId, { scale: Math.min(2, Math.max(0.25, scale)) });
    });
  }, [getActiveCanvasId]);

  // ─── UI state ────────────────────────────────────────────────────────────────

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

  // ─── Derived: активный канвас ─────────────────────────────────────────────────

  const activeCanvas = getActiveCanvas(state);

  return {
    state,
    activeCanvas,
    toggleTheme,
    addProject,
    deleteProject,
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
