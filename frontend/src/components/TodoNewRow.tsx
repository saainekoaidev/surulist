import { useRef, useState } from "react";

interface Props {
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}

export function TodoNewRow({ onSubmit, onCancel }: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cancelledRef = useRef(false);

  const handleSubmit = async () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    onCancel();
  };

  return (
    <tr className="row-new">
      <td className="col-num" style={{ color: "var(--color-primary)" }}>
        -
      </td>
      <td />
      <td className="col-overdue" />
      <td>
        <input
          className="todo-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") handleCancel();
          }}
          placeholder="Todoを入力 (全角40文字まで)"
          maxLength={40}
          autoFocus
        />
      </td>
      <td className="col-date-input" />
      <td className="col-time-input" />
      <td className="col-date" />
      <td className="col-date" />
      <td className="col-actions" />
    </tr>
  );
}
