import Icon from "@/components/ui/icon";

interface Props {
  connectingFromId: string | null;
  isDeletingNote: boolean;
  isDeletingConnection: boolean;
  canvasScale: number;
  isSaving: boolean;
  isLoggedIn: boolean;
  onAddNote: () => void;
  onStartConnect: () => void;
  onStartDeleteNote: () => void;
  onStartDeleteConnection: () => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCancel: () => void;
  onSave: () => void;
}

interface ActionBtnProps {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  success?: boolean;
  disabled?: boolean;
  spin?: boolean;
}

function ActionBtn({ icon, label, onClick, active, danger, success, disabled, spin }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={[
        "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
        active && !danger && !success ? "bg-primary text-primary-foreground shadow-lg" : "",
        active && danger ? "bg-destructive text-destructive-foreground shadow-lg" : "",
        success ? "bg-green-600/20 text-green-500" : "",
        !active && !success && danger ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "",
        !active && !success && !danger && !disabled ? "text-muted-foreground hover:text-foreground hover:bg-accent" : "",
        disabled ? "opacity-30 cursor-not-allowed" : "",
      ].filter(Boolean).join(" ")}
    >
      <Icon name={icon} size={16} className={spin ? "animate-spin" : ""} />
    </button>
  );
}

export function ActionPanel({
  connectingFromId, isDeletingNote, isDeletingConnection, canvasScale,
  isSaving, isLoggedIn,
  onAddNote, onStartConnect, onStartDeleteNote, onStartDeleteConnection,
  onResetView, onZoomIn, onZoomOut, onCancel, onSave,
}: Props) {
  const anyActive = connectingFromId !== null || isDeletingNote || isDeletingConnection;

  return (
    <div className="flex flex-col items-center gap-1 px-1.5 py-2.5 bg-card border-l border-border w-12 flex-shrink-0">
      {/* Main actions */}
      <div className="flex flex-col gap-1">
        <ActionBtn icon="Plus" label="Добавить заметку (N)" onClick={onAddNote} />
        <div className="w-6 h-px bg-border mx-auto my-0.5" />
        <ActionBtn
          icon="GitFork"
          label="Создать связь между заметками"
          onClick={connectingFromId ? onCancel : onStartConnect}
          active={connectingFromId !== null}
        />
        <ActionBtn
          icon="Unlink"
          label="Удалить связь"
          onClick={isDeletingConnection ? onCancel : onStartDeleteConnection}
          active={isDeletingConnection}
          danger={isDeletingConnection}
        />
        <div className="w-6 h-px bg-border mx-auto my-0.5" />
        <ActionBtn
          icon="Trash2"
          label="Удалить заметку"
          onClick={isDeletingNote ? onCancel : onStartDeleteNote}
          active={isDeletingNote}
          danger={true}
        />
      </div>

      {/* Cancel if active */}
      {anyActive && (
        <>
          <div className="w-6 h-px bg-border mx-auto my-0.5" />
          <ActionBtn icon="X" label="Отменить" onClick={onCancel} />
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save to cloud */}
      <div className="flex flex-col gap-1">
        <ActionBtn
          icon={isSaving ? "Loader2" : "CloudUpload"}
          label={isLoggedIn ? "Сохранить в облако" : "Войдите чтобы сохранить"}
          onClick={onSave}
          disabled={!isLoggedIn || isSaving}
          spin={isSaving}
          success={false}
        />
        <div className="w-6 h-px bg-border mx-auto my-0.5" />
        {/* View controls */}
        <ActionBtn icon="ZoomIn" label="Приблизить" onClick={onZoomIn} />
        <ActionBtn icon="ZoomOut" label="Отдалить" onClick={onZoomOut} />
        <ActionBtn icon="Maximize2" label="Сбросить вид" onClick={onResetView} />
      </div>
    </div>
  );
}
