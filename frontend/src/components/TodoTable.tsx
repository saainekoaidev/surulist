import { Fragment, useState } from "react";
import type { Todo, TodoWithCategory } from "../types";
import { STATUSES } from "../types";
import { TodoNewRow } from "./TodoNewRow";

interface Props {
  todos: (Todo | TodoWithCategory)[];
  isAllMode: boolean;
  isAdding: boolean;
  onAdd: (text: string) => Promise<void>;
  onCancelAdd: () => void;
  onUpdate: (id: number, data: { text?: string; status?: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface TodoGroup {
  categoryId: number;
  categoryName: string;
  todos: (Todo | TodoWithCategory)[];
}

function groupTodos(todos: (Todo | TodoWithCategory)[], isAllMode: boolean): TodoGroup[] {
  if (!isAllMode) {
    return [{ categoryId: 0, categoryName: "", todos }];
  }
  const map = new Map<number, TodoGroup>();
  for (const todo of todos) {
    const cat = (todo as TodoWithCategory).category;
    if (!cat) continue; // Skip stale data without category during mode transition
    if (!map.has(cat.id)) {
      map.set(cat.id, { categoryId: cat.id, categoryName: cat.name, todos: [] });
    }
    map.get(cat.id)!.todos.push(todo);
  }
  return Array.from(map.values());
}

export function TodoTable({ todos, isAllMode, isAdding, onAdd, onCancelAdd, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const startEdit = (todo: Todo | TodoWithCategory) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const commitEdit = async () => {
    if (editingId == null || !editText.trim()) return;
    await onUpdate(editingId, { text: editText.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("削除してよろしいですか?")) return;
    await onDelete(id);
    setEditingId(null);
  };

  const handleStatusChange = async (id: number, status: string) => {
    await onUpdate(id, { status });
  };

  const groups = groupTodos(todos, isAllMode);

  return (
    <>
      <div className="section-bar">
        <h2>Todo 一覧</h2>
        <span className="badge">{todos.length}件</span>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-status">Status</th>
              <th>Todo</th>
              <th className="col-date">RegistDate</th>
              <th className="col-date">UpdateDate</th>
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {isAdding && <TodoNewRow onSubmit={onAdd} onCancel={onCancelAdd} />}
            {todos.length === 0 && !isAdding && (
              <tr>
                <td colSpan={6} className="empty-state">
                  {isAllMode
                    ? "Todo がありません。"
                    : "Todo がありません。「+ 新規追加」で追加してください。"}
                </td>
              </tr>
            )}
            {groups.map((group) => (
              <Fragment key={group.categoryId || "single"}>
                {isAllMode && (
                  <tr className="group-header-row">
                    <td colSpan={6} className="group-header">
                      {group.categoryName}
                    </td>
                  </tr>
                )}
                {group.todos.map((todo, i) => {
                  const isEditing = editingId === todo.id;
                  return (
                    <tr key={todo.id} className={isEditing ? "row-editing" : ""}>
                      <td className="col-num">{i + 1}</td>
                      <td className="col-status">
                        <select
                          className="status-select"
                          data-status={todo.status}
                          value={todo.status}
                          onChange={(e) => handleStatusChange(todo.id, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className="editing-input"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            maxLength={40}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="todo-text-clickable"
                            onClick={() => startEdit(todo)}
                          >
                            {todo.text}
                          </span>
                        )}
                      </td>
                      <td className="col-date">{formatDate(todo.createdAt)}</td>
                      <td className="col-date">
                        {todo.updatedAt !== todo.createdAt ? formatDate(todo.updatedAt) : ""}
                      </td>
                      <td className="col-actions">
                        {isEditing && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={commitEdit}>
                              更新
                            </button>{" "}
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(todo.id)}
                            >
                              削除
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
