import type { LucideIcon } from "lucide-react";

export type Game = {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  available: boolean;
  accent: "pink" | "lavender" | "peach" | "mint";
  label: string;
};
