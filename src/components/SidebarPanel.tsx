import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import type { Project, TreeNode } from "@/types/waffles";

interface Props {
  projects: Project[];
  activeProjectId: string | null;
  activeTopicId: string | null;
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onAddTopic: (projectId: string, parentId: string | null, name: string) => void;
  onDeleteTopic: (projectId: string, topicId: string) => void;
  onToggleTopic: (projectId: string, topicId: string) => void;
  onSelectProject: (id: string) => void;
  onSelectTopic: (id: string) => void;
  width: number;
  onWidthChange: (w: number) => void;
}

interface InlineEditProps {
  onSubmit: (val: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

function InlineEdit({ onSubmit, onCancel, placeholder = "Название..." }: InlineEditProps) {
  const [val, setVal] = useState("");
  return (
    <form
      className="flex items-center gap-1 mt-0.5 px-1"
      onSubmit={e => { e.preventDefault(); if (val.trim()) onSubmit(val.trim()); }}
    >
      <Input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        className="h-6 text-xs px-1.5 bg-muted/50"
        onKeyDown={e => { if (e.key === "Escape") onCancel(); }}
      />
      <Button type="submit" variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0">
        <Icon name="Check" size={11} />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={onCancel}>
        <Icon name="X" size={11} />
      </Button>
    </form>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  projectId: string;
  activeTopicId: string | null;
  depth: number;
  onSelect: (id: string) => void;
  onDelete: (projectId: string, id: string) => void;
  onAddChild: (projectId: string, parentId: string, name: string) => void;
  onToggle: (projectId: string, id: string) => void;
}

function TreeNodeItem({ node, projectId, activeTopicId, depth, onSelect, onDelete, onAddChild, onToggle }: TreeNodeItemProps) {
  const [addingChild, setAddingChild] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="slide-in-left">
      <div
        className={`tree-item group ${activeTopicId === node.id ? "active" : ""}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(node.id)}
      >
        <button
          className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center opacity-50 hover:opacity-100"
          onClick={e => { e.stopPropagation(); onToggle(projectId, node.id); }}
        >
          {node.children.length > 0 ? (
            <Icon name={node.expanded ? "ChevronDown" : "ChevronRight"} size={11} />
          ) : (
            <Icon name="Minus" size={8} className="opacity-30" />
          )}
        </button>
        <Icon name="FileText" size={12} className="flex-shrink-0 opacity-60" />
        <span className="flex-1 truncate text-xs">{node.name}</span>
        {hovered && (
          <div className="flex items-center gap-0.5 ml-auto">
            <button
              className="h-4 w-4 flex items-center justify-center rounded hover:bg-primary/20 text-muted-foreground hover:text-primary"
              onClick={e => { e.stopPropagation(); setAddingChild(true); }}
              title="Добавить подпапку"
            >
              <Icon name="Plus" size={10} />
            </button>
            <button
              className="h-4 w-4 flex items-center justify-center rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
              onClick={e => { e.stopPropagation(); onDelete(projectId, node.id); }}
              title="Удалить"
            >
              <Icon name="Trash2" size={10} />
            </button>
          </div>
        )}
      </div>

      {addingChild && (
        <div style={{ paddingLeft: `${8 + (depth + 1) * 14}px` }}>
          <InlineEdit
            placeholder="Название подпапки..."
            onSubmit={name => { onAddChild(projectId, node.id, name); setAddingChild(false); }}
            onCancel={() => setAddingChild(false)}
          />
        </div>
      )}

      {node.expanded && node.children.map(child => (
        <TreeNodeItem
          key={child.id}
          node={child}
          projectId={projectId}
          activeTopicId={activeTopicId}
          depth={depth + 1}
          onSelect={onSelect}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

export function SidebarPanel({
  projects,
  activeProjectId,
  activeTopicId,
  onAddProject,
  onDeleteProject,
  onAddTopic,
  onDeleteTopic,
  onToggleTopic,
  onSelectProject,
  onSelectTopic,
  width,
  onWidthChange,
}: Props) {
  const [addingProject, setAddingProject] = useState(false);
  const [addingTopic, setAddingTopic] = useState<string | null>(null);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    resizing.current = true;
    startX.current = e.clientX;
    startW.current = width;
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const newW = Math.min(400, Math.max(160, startW.current + ev.clientX - startX.current));
      onWidthChange(newW);
    };
    const onUp = () => { resizing.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [width, onWidthChange]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="flex flex-col bg-sidebar border-r border-sidebar-border relative flex-shrink-0" style={{ width }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Проекты</span>
        <button
          className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={() => setAddingProject(true)}
          title="Новый проект"
        >
          <Icon name="Plus" size={13} />
        </button>
      </div>

      {/* Project tabs + tree */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1 space-y-0.5">
        {projects.length === 0 && (
          <div className="px-3 py-6 text-center">
            <Icon name="FolderOpen" size={28} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs text-muted-foreground">Нет проектов.<br />Нажмите + чтобы создать.</p>
          </div>
        )}

        {projects.map(project => (
          <div key={project.id}>
            <div
              className={`tree-item group font-medium ${activeProjectId === project.id ? "active" : ""}`}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
              onClick={() => onSelectProject(project.id)}
            >
              <Icon name="Folder" size={13} className="flex-shrink-0" />
              <span className="flex-1 truncate text-xs">{project.name}</span>
              {hoveredProject === project.id && (
                <div className="flex items-center gap-0.5 ml-auto">
                  <button
                    className="h-4 w-4 flex items-center justify-center rounded hover:bg-primary/20 text-muted-foreground hover:text-primary"
                    onClick={e => { e.stopPropagation(); setAddingTopic(project.id); }}
                    title="Добавить тему"
                  >
                    <Icon name="Plus" size={10} />
                  </button>
                  <button
                    className="h-4 w-4 flex items-center justify-center rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    onClick={e => { e.stopPropagation(); onDeleteProject(project.id); }}
                    title="Удалить проект"
                  >
                    <Icon name="Trash2" size={10} />
                  </button>
                </div>
              )}
            </div>

            {activeProjectId === project.id && (
              <>
                {addingTopic === project.id && (
                  <div className="pl-6">
                    <InlineEdit
                      placeholder="Название темы..."
                      onSubmit={name => { onAddTopic(project.id, null, name); setAddingTopic(null); }}
                      onCancel={() => setAddingTopic(null)}
                    />
                  </div>
                )}
                {project.topics.map(topic => (
                  <TreeNodeItem
                    key={topic.id}
                    node={topic}
                    projectId={project.id}
                    activeTopicId={activeTopicId}
                    depth={1}
                    onSelect={onSelectTopic}
                    onDelete={onDeleteTopic}
                    onAddChild={onAddTopic}
                    onToggle={onToggleTopic}
                  />
                ))}
              </>
            )}
          </div>
        ))}

        {addingProject && (
          <div className="px-1 mt-1">
            <InlineEdit
              placeholder="Название проекта..."
              onSubmit={name => { onAddProject(name); setAddingProject(false); }}
              onCancel={() => setAddingProject(false)}
            />
          </div>
        )}
      </div>

      {/* Topic add button if project selected */}
      {activeProject && (
        <div className="px-2 py-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground hover:text-primary justify-start gap-1.5"
            onClick={() => setAddingTopic(activeProjectId)}
          >
            <Icon name="Plus" size={12} />
            Добавить тему
          </Button>
        </div>
      )}

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors"
        onMouseDown={onMouseDown}
      />
    </div>
  );
}
