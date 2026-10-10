import React from "react";
import { Card } from "../elements/Card";
import { SectionHeader } from "../elements/SectionHeader";
import { ScriptInputModal } from "./ScriptInputModal";
import { useCardAction } from "../hooks/useCardAction";
import type { ContentSectionProps } from "../types/components";

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  icon,
  theme,
  cards,
}) => {
  const { modalState, handleCardAction, handleModalSubmit, closeModal } =
    useCardAction();

  return (
    <>
      <div
        className={`rounded-xl shadow-sm p-6 ${theme.bg.light} dark:${theme.bg.dark}`}
      >
        <SectionHeader title={title} Icon={icon} theme={theme} />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Card
              key={card.title}
              {...card}
              onClick={() => handleCardAction(card)}
            />
          ))}
        </div>
      </div>

      {modalState.type && (
        <ScriptInputModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          type={modalState.type}
        />
      )}
    </>
  );
};
