import { useEffect, useCallback, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SidebarPanel } from "@/components/SidebarPanel";
import { CanvasArea } from "@/components/CanvasArea";
import { ActionPanel } from "@/components/ActionPanel";
import { useWafflesState } from "@/hooks/useWafflesState";
import { useAuth } from "@/hooks/useAuth";
import type { CloudData } from "@/hooks/useAuth";
import type { Note } from "@/types/waffles";

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
    loadCloudData,
  } = useWafflesState();

  const { user, loading: authLoading, error: authError, auth, logout, saveData } = useAuth();

  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "ok" | "error">("idle");

  // Активный canvas есть?
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
    const note = activeCanvas.notes.find((n: Note) => n.id === id);
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

  // Загрузка облачных данных после входа
  const handleCloudDataLoaded = useCallback((data: CloudData) => {
    loadCloudData(data);
  }, [loadCloudData]);

  // Сохранение в облако
  const handleSave = useCallback(async () => {
    if (!user || isSaving) return;
    setIsSaving(true);
    setSaveStatus("idle");
    const ok = await saveData({
      projects: state.projects,
      canvases: state.canvases as Record<string, unknown>,
      theme: state.theme,
    });
    setIsSaving(false);
    setSaveStatus(ok ? "ok" : "error");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }, [user, isSaving, saveData, state.projects, state.canvases, state.theme]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <AppHeader
        theme={state.theme}
        onToggleTheme={toggleTheme}
        searchQuery={state.searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        authLoading={authLoading}
        authError={authError}
        onAuth={auth}
        onLogout={logout}
        onCloudDataLoaded={handleCloudDataLoaded}
      />

      {/* Save status toast */}
      {saveStatus !== "idle" && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-xs px-4 py-2 rounded-full shadow-lg ${saveStatus === "ok" ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground"}`}>
          {saveStatus === "ok" ? "✓ Данные сохранены в облако" : "✗ Ошибка сохранения. Попробуйте снова."}
        </div>
      )}

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
          isSaving={isSaving}
          isLoggedIn={!!user}
          onAddNote={addNote}
          onStartConnect={() => setConnectingFrom("__pending__")}
          onStartDeleteNote={() => setDeletingNote(true)}
          onStartDeleteConnection={() => setDeletingConnection(true)}
          onResetView={handleResetView}
          onZoomIn={() => setCanvasScale(activeCanvas.scale + 0.15)}
          onZoomOut={() => setCanvasScale(activeCanvas.scale - 0.15)}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
