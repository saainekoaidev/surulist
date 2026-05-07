import { useState, useCallback } from "react";
import type { Todo, TodoWithCategory, CategorySelection } from "../types";

const API = "/api/todos";

export function useTodos(categoryId: CategorySelection) {
  const [todos, setTodos] = useState<(Todo | TodoWithCategory)[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTodos = useCallback(async () => {
    if (categoryId == null) {
      setTodos([]);
      return;
    }
    setLoading(true);
    const url = categoryId === "all"
      ? API
      : `${API}?categoryId=${categoryId}`;
    const res = await fetch(url);
    const data = await res.json();
    setTodos(data);
    setLoading(false);
  }, [categoryId]);

  const addTodo = async (text: string) => {
    if (categoryId == null || categoryId === "all") return;
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, categoryId }),
    });
    if (!res.ok) throw new Error("Failed to create todo");
    await fetchTodos();
  };

  const updateTodo = async (id: number, data: { text?: string; status?: string }) => {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update todo");
    await fetchTodos();
  };

  const deleteTodo = async (id: number) => {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete todo");
    await fetchTodos();
  };

  return { todos, loading, fetchTodos, addTodo, updateTodo, deleteTodo };
}
