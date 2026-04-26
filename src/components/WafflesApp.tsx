import { useEffect, useCallback, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SidebarPanel } from "@/components/SidebarPanel";
import { CanvasArea } from "@/components/CanvasArea";
import { ActionPanel } from "@/components/ActionPanel";
import { useWafflesState } from "@/hooks/useWafflesState";

export function WafflesApp() {
  const {
    state,
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnectingFrom(null);
        setDeletingNote(false);
        setDeletingConnection(false);
      }
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        addNote();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [addNote, setConnectingFrom, setDeletingNote, setDeletingConnection]);

  const handleConnectStart = useCallback((id: string) => {
    if (state.connectingFromId) {
      addConnection(state.connectingFromId, id);
    } else {
      setConnectingFrom(id);
    }
  }, [state.connectingFromId, addConnection, setConnectingFrom]);

  const handleConnectEnd = useCallback((id: string) => {
    if (state.connectingFromId && state.connectingFromId !== id) {
      addConnection(state.connectingFromId, id);
    }
    setConnectingFrom(null);
  }, [state.connectingFromId, addConnection, setConnectingFrom]);

  const handleTogglePin = useCallback((id: string) => {
    const note = state.notes.find(n => n.id === id);
    if (note) updateNote(id, { pinned: !note.pinned });
  }, [state.notes, updateNote]);

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

        <CanvasArea
          notes={state.notes}
          connections={state.connections}
          selectedNoteId={state.selectedNoteId}
          connectingFromId={state.connectingFromId}
          isDeletingNote={state.isDeletingNote}
          isDeletingConnection={state.isDeletingConnection}
          canvasOffset={state.canvasOffset}
          canvasScale={state.canvasScale}
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

        <ActionPanel
          connectingFromId={state.connectingFromId}
          isDeletingNote={state.isDeletingNote}
          isDeletingConnection={state.isDeletingConnection}
          canvasScale={state.canvasScale}
          onAddNote={addNote}
          onStartConnect={() => {}}
          onStartDeleteNote={() => setDeletingNote(true)}
          onStartDeleteConnection={() => setDeletingConnection(true)}
          onResetView={handleResetView}
          onZoomIn={() => setCanvasScale(state.canvasScale + 0.15)}
          onZoomOut={() => setCanvasScale(state.canvasScale - 0.15)}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}