import { useState } from "react";

interface Props {
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}

export function TodoNewRow({ onSubmit, onCancel }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await onSubmit(text.trim());
    setText("");
  };

  return (
    <tr className="row-new">
      <td className="col-num" style={{ color: "var(--color-primary)" }}>
        -
      </td>
      <td />
      <td>
        <input
          className="todo-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Todoを入力 (全角40文字まで)"
          maxLength={40}
          autoFocus
        />
      </td>
      <td className="col-deadline" />
      <td className="col-date" />
      <td className="col-date" />
      <td className="col-actions">
        <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
          登録
        </button>
      </td>
    </tr>
  );
}
