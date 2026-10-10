import {
  PhotoIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  Bars3Icon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/solid";
import { Scene } from "../../types/scenes";
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../../config/api";

interface SceneCardProps {
  index: number;
  scene: Scene;
  onPlay: () => void;
  onMediaClick: () => void;
  onDescriptionChange: (description: string) => void;
  isCurrentScene: boolean;
  onFocus: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  index,
  onPlay,
  onMediaClick,
  onDescriptionChange,
  isCurrentScene,
  onFocus,
  onDelete,
  onDuplicate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(scene.speech);
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionsTimeoutRef = useRef<number>();

  useEffect(() => {
    setDescription(scene.speech);
  }, [scene.speech]);

  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleDescriptionBlur = () => {
    setIsEditing(false);
    if (description !== scene.speech) {
      onDescriptionChange(description);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.blur();
    }
  };

  const getWordCount = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  const handleMouseEnter = () => {
    if (actionsTimeoutRef.current) {
      window.clearTimeout(actionsTimeoutRef.current);
    }
    setShowActions(true);
  };

  const handleMouseLeave = () => {
    actionsTimeoutRef.current = window.setTimeout(() => {
      setShowActions(false);
    }, 300);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate && !isDuplicating) {
      try {
        setIsDuplicating(true);
        setActionError(null);
        await onDuplicate();
      } catch (error) {
        setActionError("Failed to duplicate scene");
      } finally {
        setIsDuplicating(false);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && !isDeleting) {
      try {
        setIsDeleting(true);
        setActionError(null);
        await onDelete();
      } catch (error) {
        setActionError("Failed to delete scene");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const wordCount = getWordCount(description);

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-all cursor-pointer
        ${isCurrentScene 
          ? "ring-2 ring-purple-500 border-purple-500 shadow-purple-500/20" 
          : "border border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:ring-1 hover:ring-purple-300 hover:shadow-lg"}`}
      onClick={onPlay}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Action Error Message */}
      {actionError && (
        <div className="absolute -top-12 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm py-2 px-3 rounded-lg border border-red-200 dark:border-red-800 shadow-sm">
          {actionError}
          <button 
            onClick={() => setActionError(null)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-600"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scene Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="text-xs font-medium text-purple-500 dark:text-purple-400">
          Scene {index + 1}
        </div>
        
        {/* Action Buttons */}
        <div 
          className={`flex items-center space-x-2 transition-opacity duration-200
            ${showActions ? 'opacity-100' : 'opacity-0'}`}
        >
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            title="Duplicate scene"
          >
            {isDuplicating ? (
              <ArrowPathIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 animate-spin" />
            ) : (
              <DocumentDuplicateIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            title="Delete scene"
          >
            {isDeleting ? (
              <ArrowPathIcon className="w-4 h-4 text-red-500 dark:text-red-400 animate-spin" />
            ) : (
              <TrashIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400" />
            )}
          </button>
        </div>
      </div>

      <div className="flex p-4 gap-4 pl-10">
        {/* Description */}
        <div className="flex-[0.85]">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={description}
              onChange={handleDescriptionChange}
              onBlur={handleDescriptionBlur}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 bg-gray-50/50 dark:bg-gray-900/50"
              rows={3}
              autoFocus
            />
          ) : (
            <div
              onClick={handleDescriptionClick}
              onFocus={onFocus}
              tabIndex={0}
              className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {description}
            </div>
          )}
        </div>

        {/* Media */}
        <div
          className="flex-[0.15] aspect-video bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer overflow-hidden group-hover:ring-1 group-hover:ring-purple-300 transition-all relative"
          onClick={(e) => {
            e.stopPropagation();
            onMediaClick();
          }}
          onFocus={onFocus}
          tabIndex={0}
        >
          {scene.mediaUrls?.[0] ? (
            <div className="relative w-full h-full">
              <img
                src={scene.mediaUrls[0]}
                alt={scene.mediaPrompt || "Scene media"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <PencilIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors">
              <PhotoIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <Bars3Icon className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};
