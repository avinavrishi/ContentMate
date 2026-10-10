export type ModelType = "deepseek" | "llama";
export type ActionType = "video" | "blog" | "social" | "presentation";

export const actions: { id: ActionType; name: string; description: string }[] =
  [
    {
      id: "video",
      name: "Video Script",
      description: "Generate engaging video scripts",
    },
    {
      id: "blog",
      name: "Blog Post",
      description: "Create detailed blog articles",
    },
    {
      id: "social",
      name: "Social Media",
      description: "Write social media content",
    },
    {
      id: "presentation",
      name: "Presentation",
      description: "Design presentation scripts",
    },
  ];
