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
  onUpdate: (id: number, data: { text?: string; status?: string; deadline?: string | null }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onRefresh?: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateAndTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

function buildDeadline(date: string, time: string): string | null {
  if (!date) return null;
  return time ? `${date}T${time}` : `${date}T00:00`;
}

/** Parse date input: "20260507" | "2026/05/07" | "2026-5-7" → "2026-05-07", or null */
function parseDateInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let year: number, month: number, day: number;

  const sepMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (sepMatch) {
    year = parseInt(sepMatch[1], 10);
    month = parseInt(sepMatch[2], 10);
    day = parseInt(sepMatch[3], 10);
  } else {
    const pureMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!pureMatch) return null;
    year = parseInt(pureMatch[1], 10);
    month = parseInt(pureMatch[2], 10);
    day = parseInt(pureMatch[3], 10);
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parse time input: "1234" | "930" | "12:34" | "9:30" → "12:34" | "09:30", or null */
function parseTimeInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let hour: number, min: number;

  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    hour = parseInt(colonMatch[1], 10);
    min = parseInt(colonMatch[2], 10);
  } else {
    const pureMatch = trimmed.match(/^(\d{1,2})(\d{2})$/);
    if (!pureMatch) return null;
    hour = parseInt(pureMatch[1], 10);
    min = parseInt(pureMatch[2], 10);
  }

  if (hour > 23 || min > 59) return null;

  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function DeadlineCell({ todoId, deadline, onUpdate }: {
  todoId: number;
  deadline: string | null;
  onUpdate: (id: number, data: { deadline: string | null }) => Promise<void>;
}) {
  const server = toDateAndTime(deadline);
  const [dateText, setDateText] = useState(server.date ? server.date.replace(/-/g, "/") : "");
  const [timeText, setTimeText] = useState(server.time);

  const commit = () => {
    const parsedDate = parseDateInput(dateText);
    const parsedTime = parseTimeInput(timeText);

    // Normalize display: valid → formatted, invalid → cleared
    setDateText(parsedDate ? parsedDate.replace(/-/g, "/") : "");
    setTimeText(parsedTime ?? "");

    const newVal = parsedDate ? buildDeadline(parsedDate, parsedTime ?? "") : null;
    const origVal = buildDeadline(server.date, server.time);
    if (newVal !== origVal) {
      onUpdate(todoId, { deadline: newVal });
    }
  };

  return (
    <>
      <td className="col-date-input">
        <input
          type="text"
          className="deadline-input"
          value={dateText}
          onChange={(e) => setDateText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          placeholder="yyyy/mm/dd"
          maxLength={10}
        />
      </td>
      <td className="col-time-input">
        <input
          type="text"
          className="deadline-input"
          value={timeText}
          onChange={(e) => setTimeText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          placeholder="hh:mm"
          maxLength={5}
        />
      </td>
    </>
  );
}

interface TodoGroup {
  categoryId: number;
  categoryName: string;
  todos: (Todo | TodoWithCategory)[];
}

function isOverdue(deadline: string | null, status: string): boolean {
  if (!deadline || status === "Done") return false;
  return new Date(deadline) < new Date();
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

export function TodoTable({ todos, isAllMode, isAdding, onAdd, onCancelAdd, onUpdate, onDelete, onRefresh }: Props) {
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
        <span style={{ flex: 1 }} />
        {onRefresh && (
          <button className="btn-refresh" onClick={onRefresh} title="リフレッシュ">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1v5h5" />
              <path d="M15 15v-5h-5" />
              <path d="M13.5 6A6 6 0 0 0 3 3.5L1 6M2.5 10a6 6 0 0 0 10.5 2.5L15 10" />
            </svg>
          </button>
        )}
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-status">Status</th>
              <th className="col-overdue" />
              <th>Todo</th>
              <th className="col-date-input">Date</th>
              <th className="col-time-input">Time</th>
              <th className="col-date">RegistDate</th>
              <th className="col-date">UpdateDate</th>
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {isAdding && <TodoNewRow onSubmit={onAdd} onCancel={onCancelAdd} />}
            {todos.length === 0 && !isAdding && (
              <tr>
                <td colSpan={9} className="empty-state">
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
                    <td colSpan={9} className="group-header">
                      {group.categoryName}
                    </td>
                  </tr>
                )}
                {group.todos.map((todo, i) => {
                  const isEditing = editingId === todo.id;
                  const overdue = isOverdue(todo.deadline, todo.status);
                  return (
                    <tr key={todo.id} className={isEditing ? "row-editing" : overdue ? "row-overdue" : ""}>
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
                      <td className="col-overdue">
                        {overdue && <span className="overdue-mark">!!</span>}
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
                      <DeadlineCell todoId={todo.id} deadline={todo.deadline} onUpdate={onUpdate} />
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
