import { useState } from "react";
import type { Category, SortKey } from "../types";

interface Props {
  categories: Category[];
  showAllEnabled: boolean;
  onShowAllChange: (enabled: boolean) => void;
  defaultSort: SortKey;
  onDefaultSortChange: (sort: SortKey) => void;
  onAdd: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
}

export function CategoryDialog({ categories, showAllEnabled, onShowAllChange, defaultSort, onDefaultSortChange, onAdd, onUpdate, onDelete, onClose }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditValue(cat.name);
  };

  const commitEdit = async () => {
    if (editingId == null || !editValue.trim()) return;
    await onUpdate(editingId, editValue.trim());
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = async (cat: Category) => {
    const count = cat._count.todos;
    const msg =
      count > 0
        ? `${count}件の Todo も削除されます。よろしいですか?`
        : "この目的を削除してよろしいですか?";
    if (!window.confirm(msg)) return;
    await onDelete(cat.id);
  };

  const commitAdd = async () => {
    if (!newName.trim()) return;
    await onAdd(newName.trim());
    setNewName("");
    setIsAdding(false);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>目的の管理</h3>
        <ul className="dialog-list">
          {categories.map((cat) => (
            <li key={cat.id}>
              <span className="obj-name">
                {editingId === cat.id ? (
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => startEdit(cat)}
                    style={{ cursor: "pointer" }}
                  >
                    {cat.name}
                  </span>
                )}
              </span>
              <span className="obj-count">{cat._count.todos}件</span>
              <button
                className="btn-icon"
                title="削除"
                onClick={() => handleDelete(cat)}
              >
                ✕
              </button>
            </li>
          ))}
          {isAdding && (
            <li>
              <span className="obj-name">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitAdd();
                    if (e.key === "Escape") {
                      setIsAdding(false);
                      setNewName("");
                    }
                  }}
                  placeholder="目的名を入力"
                  autoFocus
                />
              </span>
              <span className="obj-count" />
              <button className="btn-icon" onClick={commitAdd} title="確定">
                ✓
              </button>
            </li>
          )}
        </ul>
        <div className="dialog-options">
          <label className="dialog-option-label">
            <input
              type="checkbox"
              checked={showAllEnabled}
              onChange={(e) => onShowAllChange(e.target.checked)}
            />
            全件表示を許可する
          </label>
          <label className="dialog-option-label">
            並び順の初期値
            <select
              className="sort-select-sm"
              value={defaultSort}
              onChange={(e) => onDefaultSortChange(e.target.value as SortKey)}
            >
              <option value="registDate">登録日順</option>
              <option value="deadline">期限順</option>
            </select>
          </label>
        </div>
        <div className="dialog-footer">
          <button className="btn btn-outline btn-sm" onClick={() => setIsAdding(true)}>
            + 追加
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
