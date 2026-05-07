export interface Category {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: { todos: number };
}

export interface Todo {
  id: number;
  text: string;
  status: string;
  categoryId: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TodoWithCategory extends Todo {
  category: {
    id: number;
    name: string;
  };
}

export type CategorySelection = number | "all" | null;

export type SortKey = "registDate" | "deadline";

export const STATUSES = [
  "Not Started",
  "In Progress",
  "Pending",
  "Done",
] as const;

export type Status = (typeof STATUSES)[number];
