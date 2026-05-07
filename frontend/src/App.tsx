import { useState, useEffect } from "react";
import type { CategorySelection } from "./types";
import { useCategories } from "./hooks/useCategories";
import { useTodos } from "./hooks/useTodos";
import { useShowAllPreference } from "./hooks/useShowAllPreference";
import { CategorySelector } from "./components/CategorySelector";
import { CategoryDialog } from "./components/CategoryDialog";
import { TodoTable } from "./components/TodoTable";

export function App() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategorySelection>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showAllEnabled, setShowAllEnabled] = useShowAllPreference();

  const {
    categories,
    loading: catLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const {
    todos,
    loading: todoLoading,
    fetchTodos,
    addTodo,
    updateTodo,
    deleteTodo,
  } = useTodos(selectedCategoryId);

  const isAllMode = selectedCategoryId === "all";

  // Auto-select first category on initial load or when categories change
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId == null) {
      setSelectedCategoryId(categories[0].id);
    }
    // If selected category was deleted, fall back to first
    if (
      selectedCategoryId != null &&
      selectedCategoryId !== "all" &&
      categories.length > 0 &&
      !categories.find((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(categories[0].id);
    }
    if (categories.length === 0) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  // When showAllEnabled is toggled OFF while "all" is selected, fall back
  useEffect(() => {
    if (!showAllEnabled && selectedCategoryId === "all") {
      setSelectedCategoryId(categories.length > 0 ? categories[0].id : null);
    }
  }, [showAllEnabled, selectedCategoryId, categories]);

  // Cancel adding when switching to "all" mode
  useEffect(() => {
    if (isAllMode) {
      setIsAdding(false);
    }
  }, [isAllMode]);

  // Fetch todos when selected category changes
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAdd = async (text: string) => {
    await addTodo(text);
    setIsAdding(false);
  };

  const handleDeleteCategory = async (id: number) => {
    await deleteCategory(id);
  };

  if (catLoading) {
    return (
      <div className="app">
        <header className="header">
          <h1>するリスト</h1>
        </header>
        <main className="main">
          <p>読み込み中...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>するリスト</h1>
      </header>
      <main className="main">
        <CategorySelector
          categories={categories}
          selectedId={selectedCategoryId}
          showAllEnabled={showAllEnabled}
          onSelect={setSelectedCategoryId}
          onEditClick={() => setShowDialog(true)}
          onAddTodoClick={() => setIsAdding(true)}
        />

        {todoLoading ? (
          <p>読み込み中...</p>
        ) : (
          <TodoTable
            todos={todos}
            isAllMode={isAllMode}
            isAdding={isAdding}
            onAdd={handleAdd}
            onCancelAdd={() => setIsAdding(false)}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            onRefresh={fetchTodos}
          />
        )}

        {showDialog && (
          <CategoryDialog
            categories={categories}
            showAllEnabled={showAllEnabled}
            onShowAllChange={setShowAllEnabled}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={handleDeleteCategory}
            onClose={() => setShowDialog(false)}
          />
        )}
      </main>
    </div>
  );
}
