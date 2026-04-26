import { useEffect, useCallback, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SidebarPanel } from "@/components/SidebarPanel";
import { CanvasArea } from "@/components/CanvasArea";
import { ActionPanel } from "@/components/ActionPanel";
import { useWafflesState } from "@/hooks/useWafflesState";

export function WafflesApp() {
  const {
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
  } = useWafflesState();

  const [sidebarWidth, setSidebarWidth] = useState(220);

  // Определяем, выбран ли хоть какой-то узел дерева
  const hasActiveCanvas = !!(state.activeTopicId ?? state.activeProjectId);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnectingFrom(null);
        setDeletingNote(false);
        setDeletingConnection(false);
      }
      if (
        e.key === "n" && !e.ctrlKey && !e.metaKey &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        addNote();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addNote, setConnectingFrom, setDeletingNote, setDeletingConnection]);

  const handleConnectStart = useCallback((id: string) => {
    if (state.connectingFromId && state.connectingFromId !== "__pending__" && state.connectingFromId !== id) {
      addConnection(state.connectingFromId, id);
    } else {
      setConnectingFrom(id);
    }
  }, [state.connectingFromId, addConnection, setConnectingFrom]);

  const handleConnectEnd = useCallback((id: string) => {
    if (!state.connectingFromId) return;
    if (state.connectingFromId === "__pending__") {
      setConnectingFrom(id);
      return;
    }
    if (state.connectingFromId !== id) {
      addConnection(state.connectingFromId, id);
    } else {
      setConnectingFrom(null);
    }
  }, [state.connectingFromId, addConnection, setConnectingFrom]);

  const handleTogglePin = useCallback((id: string) => {
    const note = activeCanvas.notes.find(n => n.id === id);
    if (note) updateNote(id, { pinned: !note.pinned });
  }, [activeCanvas.notes, updateNote]);

  const handleCancel = useCallback(() => {
    setConnectingFrom(null);
    setDeletingNote(false);
    setDeletingConnection(false);
  }, [setConnectingFrom, setDeletingNote, setDeletingConnection]);

  const handleResetView = useCallback(() => {
    setCanvasOffset({ x: 0, y: 0 });
    setCanvasScale(1);
  }, [setCanvasOffset, setCanvasScale]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <AppHeader
        theme={state.theme}
        onToggleTheme={toggleTheme}
        searchQuery={state.searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex flex-1 overflow-hidden">
        <SidebarPanel
          projects={state.projects}
          activeProjectId={state.activeProjectId}
          activeTopicId={state.activeTopicId}
          onAddProject={addProject}
          onDeleteProject={deleteProject}
          onAddTopic={addTopic}
          onDeleteTopic={deleteTopic}
          onToggleTopic={toggleTopic}
          onSelectProject={setActiveProject}
          onSelectTopic={setActiveTopic}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
        />

        {hasActiveCanvas ? (
          <CanvasArea
            key={state.activeTopicId ?? state.activeProjectId ?? ""}
            notes={activeCanvas.notes}
            connections={activeCanvas.connections}
            selectedNoteId={state.selectedNoteId}
            connectingFromId={state.connectingFromId}
            isDeletingNote={state.isDeletingNote}
            isDeletingConnection={state.isDeletingConnection}
            canvasOffset={activeCanvas.offset}
            canvasScale={activeCanvas.scale}
            searchQuery={state.searchQuery}
            onSelectNote={setSelectedNote}
            onMoveNote={moveNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onDuplicateNote={duplicateNote}
            onConnectStart={handleConnectStart}
            onConnectEnd={handleConnectEnd}
            onTogglePin={handleTogglePin}
            onDeleteConnection={deleteConnection}
            onOffsetChange={setCanvasOffset}
            onScaleChange={setCanvasScale}
            onCanvasClick={() => { setSelectedNote(null); handleCancel(); }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center canvas-grid">
            <div className="text-center opacity-25 select-none">
              <div className="text-5xl mb-4">🧇</div>
              <p className="text-sm font-medium">Выберите проект или тему</p>
              <p className="text-xs mt-1 text-muted-foreground">в левой панели для работы с заметками</p>
            </div>
          </div>
        )}

        <ActionPanel
          connectingFromId={state.connectingFromId}
          isDeletingNote={state.isDeletingNote}
          isDeletingConnection={state.isDeletingConnection}
          canvasScale={activeCanvas.scale}
          onAddNote={addNote}
          onStartConnect={() => setConnectingFrom("__pending__")}
          onStartDeleteNote={() => setDeletingNote(true)}
          onStartDeleteConnection={() => setDeletingConnection(true)}
          onResetView={handleResetView}
          onZoomIn={() => setCanvasScale(activeCanvas.scale + 0.15)}
          onZoomOut={() => setCanvasScale(activeCanvas.scale - 0.15)}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
