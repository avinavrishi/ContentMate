import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardData } from "../types/components";
import { VideoAction, AudioAction, ActionToPath } from "../types/enums";

interface ScriptModalState {
  isOpen: boolean;
  type: "video" | "audio" | null;
}

export const useCardAction = () => {
  const navigate = useNavigate();
  const [modalState, setModalState] = useState<ScriptModalState>({
    isOpen: false,
    type: null,
  });

  const handleCardAction = (card: CardData) => {
    if (card.type === "navigation") {
      navigate(card.href);
    } else if (card.type === "action") {
      const action = card.action as keyof typeof ActionToPath;

      // Handle script-based actions that need modal
      if (
        action === VideoAction.TRANSFORM_FROM_SCRIPT ||
        action === AudioAction.TRANSFORM_FROM_SCRIPT
      ) {
        setModalState({
          isOpen: true,
          type:
            action === VideoAction.TRANSFORM_FROM_SCRIPT ? "video" : "audio",
        });
        return;
      }

      // For all other actions, navigate directly using the mapping
      navigate(ActionToPath[action]);
    }
  };

  const handleModalSubmit = (
    script: string,
    duration: number,
    shouldSummarize: boolean
  ) => {
    const { type } = modalState;
    const path =
      type === "video"
        ? ActionToPath[VideoAction.TRANSFORM_FROM_SCRIPT]
        : ActionToPath[AudioAction.TRANSFORM_FROM_SCRIPT];

    navigate(path, {
      state: { script, duration, shouldSummarize },
    });

    setModalState({ isOpen: false, type: null });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
  };

  return {
    modalState,
    handleCardAction,
    handleModalSubmit,
    closeModal,
  };
};
