import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoTable } from "./TodoTable";
import type { Todo, TodoWithCategory } from "../types";

const todos: Todo[] = [
  { id: 1, text: "タスクA", status: "Not Started", categoryId: 1, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
  { id: 2, text: "タスクB", status: "Done", categoryId: 1, createdAt: "2026-05-02T00:00:00Z", updatedAt: "2026-05-03T00:00:00Z" },
];

const defaultProps = {
  todos,
  isAllMode: false,
  isAdding: false,
  onAdd: vi.fn(),
  onCancelAdd: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
};

describe("TodoTable", () => {
  it("renders todo items with row numbers", () => {
    render(<TodoTable {...defaultProps} />);
    expect(screen.getByText("タスクA")).toBeInTheDocument();
    expect(screen.getByText("タスクB")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows total count badge", () => {
    render(<TodoTable {...defaultProps} />);
    expect(screen.getByText("2件")).toBeInTheDocument();
  });

  it("shows empty state when no todos", () => {
    render(<TodoTable {...defaultProps} todos={[]} />);
    expect(screen.getByText(/Todo がありません/)).toBeInTheDocument();
  });

  it("shows different empty message in all mode", () => {
    render(<TodoTable {...defaultProps} todos={[]} isAllMode={true} />);
    const emptyText = screen.getByText("Todo がありません。");
    expect(emptyText).toBeInTheDocument();
    expect(screen.queryByText(/新規追加/)).not.toBeInTheDocument();
  });

  it("enters edit mode on todo text click", async () => {
    render(<TodoTable {...defaultProps} />);
    await userEvent.click(screen.getByText("タスクA"));
    expect(screen.getByDisplayValue("タスクA")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
  });

  it("calls onUpdate when edit is committed", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<TodoTable {...defaultProps} onUpdate={onUpdate} />);
    await userEvent.click(screen.getByText("タスクA"));
    const input = screen.getByDisplayValue("タスクA");
    await userEvent.clear(input);
    await userEvent.type(input, "修正後{Enter}");
    expect(onUpdate).toHaveBeenCalledWith(1, { text: "修正後" });
  });

  it("calls onUpdate on status change", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<TodoTable {...defaultProps} onUpdate={onUpdate} />);
    const selects = screen.getAllByRole("combobox");
    await userEvent.selectOptions(selects[0], "In Progress");
    expect(onUpdate).toHaveBeenCalledWith(1, { status: "In Progress" });
  });

  it("calls onDelete with confirmation", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TodoTable {...defaultProps} onDelete={onDelete} />);

    await userEvent.click(screen.getByText("タスクA"));
    await userEvent.click(screen.getByRole("button", { name: "削除" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("does not delete when confirmation is cancelled", async () => {
    const onDelete = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<TodoTable {...defaultProps} onDelete={onDelete} />);

    await userEvent.click(screen.getByText("タスクA"));
    await userEvent.click(screen.getByRole("button", { name: "削除" }));

    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe("TodoTable - all mode grouping (US-007)", () => {
  const groupedTodos: TodoWithCategory[] = [
    { id: 1, text: "仕事タスク", status: "Not Started", categoryId: 1, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", category: { id: 1, name: "仕事" } },
    { id: 2, text: "仕事タスク2", status: "Done", categoryId: 1, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", category: { id: 1, name: "仕事" } },
    { id: 3, text: "私用タスク", status: "In Progress", categoryId: 2, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", category: { id: 2, name: "私用" } },
  ];

  it("renders category group headers", () => {
    const { container } = render(<TodoTable {...defaultProps} todos={groupedTodos} isAllMode={true} />);
    const headers = container.querySelectorAll(".group-header");
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveTextContent("仕事");
    expect(headers[1]).toHaveTextContent("私用");
  });

  it("shows total count across all groups", () => {
    render(<TodoTable {...defaultProps} todos={groupedTodos} isAllMode={true} />);
    expect(screen.getByText("3件")).toBeInTheDocument();
  });

  it("numbers rows per group starting from 1", () => {
    const { container } = render(<TodoTable {...defaultProps} todos={groupedTodos} isAllMode={true} />);
    const numCells = container.querySelectorAll(".col-num");
    // thead has one .col-num, then each todo row has one
    // Group 1: 1, 2  Group 2: 1
    const rowNums = Array.from(numCells).slice(1).map(el => el.textContent);
    expect(rowNums).toEqual(["1", "2", "1"]);
  });
});
