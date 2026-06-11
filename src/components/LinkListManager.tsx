import React, { useState, useEffect } from "react";
import { LinkItem } from "../types";
import { 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Plus,
  Compass,
  GripVertical
} from "lucide-react";
import { AVAILABLE_ICONS } from "./AddEditLinkModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LinkListManagerProps {
  links: LinkItem[];
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (link: LinkItem) => void;
  onReorder: (linkIds: string[]) => void;
  onAddTrigger: () => void;
}

const renderIcon = (iconId: string) => {
  const iconObj = AVAILABLE_ICONS.find(i => i.id === iconId);
  if (iconObj) {
    const IconComponent = iconObj.icon;
    return <IconComponent className="w-4 h-4 text-amber-500" />;
  }
  return <Compass className="w-4 h-4 text-amber-500" />;
};

interface SortableLinkItemProps {
  link: LinkItem;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (link: LinkItem) => void;
}

function SortableLinkItem({ link, onEdit, onDelete, onToggleActive }: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
        link.is_active 
          ? "border-white/10 bg-black/40 hover:bg-black/60" 
          : "border-white/5 bg-black/10 opacity-60"
      }`}
    >
      {/* Left side info block with Drag Handle */}
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div 
          className="cursor-grab active:cursor-grabbing p-1 text-neutral-500 hover:text-white"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="p-2 rounded-lg bg-neutral-900 border border-white/5 shrink-0">
          {renderIcon(link.icon)}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-white truncate">
            {link.title}
          </span>
          <span className="text-[10px] text-neutral-400 truncate font-mono">
            {link.url}
          </span>
        </div>
      </div>

      {/* Right side controls block */}
      <div className="flex items-center space-x-1 shrink-0">
        <button
          type="button"
          onClick={() => onToggleActive(link)}
          className={`p-2 rounded-md hover:bg-white/5 transition-all ${
            link.is_active ? "text-emerald-400 hover:text-emerald-300" : "text-neutral-500 hover:text-neutral-300"
          }`}
          title={link.is_active ? "Hide connection" : "Show connection"}
        >
          {link.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => onEdit(link)}
          className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-all"
          title="Edit connection info"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(link.id)}
          className="p-2 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
          title="Remove connection link"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function LinkListManager({
  links,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
  onAddTrigger
}: LinkListManagerProps) {
  
  const [internalLinks, setInternalLinks] = useState(links);

  useEffect(() => {
    setInternalLinks(links);
  }, [links]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setInternalLinks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        onReorder(newOrder.map(l => l.id));
        return newOrder;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Connection Links ({internalLinks.length})
          </span>
          <span className="text-[10px] text-neutral-400">
            Design, order, and toggle links mapping to your NFC tag profile
          </span>
        </div>

        <button
          type="button"
          onClick={onAddTrigger}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 font-semibold text-xs text-black rounded-lg transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Link</span>
        </button>
      </div>

      {internalLinks.length === 0 ? (
        <div className="p-8 text-center bg-black/20 border border-dashed border-white/10 rounded-xl">
          <p className="text-xs text-neutral-400">No active links configured.</p>
          <p className="text-[11px] text-neutral-500 mt-1 mb-4">Add your first social page, file, or phone direct contact.</p>
          <button
            type="button"
            onClick={onAddTrigger}
            className="inline-flex items-center space-x-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Connection</span>
          </button>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={internalLinks.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {internalLinks.map((link) => (
                <SortableLinkItem 
                  key={link.id} 
                  link={link} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  onToggleActive={onToggleActive} 
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
export { AVAILABLE_ICONS };
