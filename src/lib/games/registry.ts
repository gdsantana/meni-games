import { Bomb, Grid2X2, Search, Sparkles } from "lucide-react";
import type { Game } from "./types";

export const games: Game[] = [
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
    href: "#",
    icon: Search,
    available: false,
    accent: "lavender",
    label: "Em breve",
  },
  {
    id: "memory-match",
    name: "Jogo da memória",
    description: "Vire as cartas e encontre todos os pares.",
    href: "#",
    icon: Sparkles,
    available: false,
    accent: "peach",
    label: "Em breve",
  },
  {
    id: "minesweeper",
    name: "Campo minado",
    description: "Use a lógica para descobrir cada casa segura.",
    href: "#",
    icon: Bomb,
    available: false,
    accent: "mint",
    label: "Em breve",
  },
];
