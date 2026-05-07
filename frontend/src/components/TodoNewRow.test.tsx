import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoNewRow } from "./TodoNewRow";

// TodoNewRow renders <tr>, so wrap in table/tbody
function renderInTable(ui: React.ReactElement) {
  return render(<table><tbody>{ui}</tbody></table>);
}

describe("TodoNewRow", () => {
  it("renders input with placeholder", () => {
    renderInTable(<TodoNewRow onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Todoを入力/)).toBeInTheDocument();
  });

  it("calls onSubmit with text on Enter", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderInTable(<TodoNewRow onSubmit={onSubmit} onCancel={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Todoを入力/);
    await userEvent.type(input, "新しいタスク{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("新しいタスク");
  });

  it("calls onSubmit with text on button click", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderInTable(<TodoNewRow onSubmit={onSubmit} onCancel={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Todoを入力/);
    await userEvent.type(input, "ボタンで登録");
    await userEvent.click(screen.getByRole("button", { name: "登録" }));
    expect(onSubmit).toHaveBeenCalledWith("ボタンで登録");
  });

  it("does not submit empty text", async () => {
    const onSubmit = vi.fn();
    renderInTable(<TodoNewRow onSubmit={onSubmit} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "登録" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not submit whitespace-only text", async () => {
    const onSubmit = vi.fn();
    renderInTable(<TodoNewRow onSubmit={onSubmit} onCancel={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Todoを入力/);
    await userEvent.type(input, "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel on Escape", async () => {
    const onCancel = vi.fn();
    renderInTable(<TodoNewRow onSubmit={vi.fn()} onCancel={onCancel} />);
    const input = screen.getByPlaceholderText(/Todoを入力/);
    await userEvent.type(input, "{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
