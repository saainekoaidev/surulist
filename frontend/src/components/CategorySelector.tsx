import type { Category, CategorySelection } from "../types";

interface Props {
  categories: Category[];
  selectedId: CategorySelection;
  showAllEnabled: boolean;
  onSelect: (id: CategorySelection) => void;
  onEditClick: () => void;
  onAddTodoClick: () => void;
}

export function CategorySelector({
  categories,
  selectedId,
  showAllEnabled,
  onSelect,
  onEditClick,
  onAddTodoClick,
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSelect(value === "all" ? "all" : Number(value));
  };

  const isAllSelected = selectedId === "all";

  return (
    <div className="toolbar">
      <select
        value={selectedId ?? ""}
        onChange={handleChange}
        disabled={categories.length === 0}
      >
        {categories.length === 0 && <option value="">-- 目的を追加してください --</option>}
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        {showAllEnabled && categories.length > 0 && (
          <option value="all">(全て)</option>
        )}
      </select>
      <button className="btn btn-outline btn-sm" onClick={onEditClick}>
        編集
      </button>
      <span className="toolbar-spacer" />
      <button
        className="btn btn-primary btn-sm"
        onClick={onAddTodoClick}
        disabled={selectedId == null || isAllSelected}
        title={isAllSelected ? "全件表示中は新規追加できません" : undefined}
      >
        + 新規追加
      </button>
    </div>
  );
}
