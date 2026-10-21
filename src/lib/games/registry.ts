import { Brain, Grid2X2, Search } from "lucide-react";
import type { Game } from "./types";

export const games: Game[] = [
  {
    id: "logic",
    name: "Jogos de lógica",
    description: "Conecte pistas e descubra quem é quem. Com especial Taylor Swift.",
    href: "/games/logic",
    icon: Brain,
    available: true,
    accent: "peach",
    label: "Disponível",
  },
  {
    id: "sudoku",
    name: "Sudoku",
    description: "Um clássico para exercitar a mente, no seu ritmo.",
    href: "/games/sudoku",
    icon: Grid2X2,
    available: true,
    accent: "pink",
    label: "Disponível",
  },
  {
    id: "word-search",
    name: "Caça-palavras",
    description: "Encontre palavras escondidas entre as letras.",
    href: "/games/word-search",
    icon: Search,
    available: true,
    accent: "lavender",
    label: "Disponível",
  },
];
