import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoTable } from "./TodoTable";
import type { Todo, TodoWithCategory } from "../types";

const todos: Todo[] = [
  { id: 1, text: "タスクA", status: "Not Started", categoryId: 1, deadline: null, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
  { id: 2, text: "タスクB", status: "Done", categoryId: 1, deadline: "2026-06-15T14:30:00Z", createdAt: "2026-05-02T00:00:00Z", updatedAt: "2026-05-03T00:00:00Z" },
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

describe("TodoTable - deadline columns (US-008, US-013)", () => {
  it("renders Date and Time column headers", () => {
    render(<TodoTable {...defaultProps} />);
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  it("renders date and time text inputs for each todo", () => {
    const { container } = render(<TodoTable {...defaultProps} />);
    const dateInputs = container.querySelectorAll('.col-date-input input');
    const timeInputs = container.querySelectorAll('.col-time-input input');
    expect(dateInputs).toHaveLength(2);
    expect(timeInputs).toHaveLength(2);
  });

  it("shows date and time values when deadline is set", () => {
    const { container } = render(<TodoTable {...defaultProps} />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>('.col-date-input input');
    const timeInputs = container.querySelectorAll<HTMLInputElement>('.col-time-input input');
    // First todo has no deadline
    expect(dateInputs[0].value).toBe("");
    expect(timeInputs[0].value).toBe("");
    // Second todo has deadline 2026-06-15T14:30:00Z — displayed in local time with "/" separator
    expect(dateInputs[1].value).not.toBe("");
    expect(timeInputs[1].value).not.toBe("");
  });

  it("calls onUpdate with deadline on date blur (deferred commit)", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<TodoTable {...defaultProps} onUpdate={onUpdate} />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>('.col-date-input input');

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(dateInputs[0], { target: { value: "2026/07/01" } });
    // onUpdate should NOT be called yet (deferred)
    expect(onUpdate).not.toHaveBeenCalled();
    // Trigger blur to commit
    fireEvent.blur(dateInputs[0]);
    expect(onUpdate).toHaveBeenCalledWith(1, { deadline: "2026-07-01T00:00" });
  });

  it("calls onUpdate with deadline on Enter key", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<TodoTable {...defaultProps} onUpdate={onUpdate} />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>('.col-date-input input');

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(dateInputs[0], { target: { value: "2026/08/01" } });
    fireEvent.keyDown(dateInputs[0], { key: "Enter" });
    expect(onUpdate).toHaveBeenCalledWith(1, { deadline: "2026-08-01T00:00" });
  });

  it("calls onUpdate with null when date is cleared", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<TodoTable {...defaultProps} onUpdate={onUpdate} />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>('.col-date-input input');

    // Clear the second todo's date (which has a value)
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(dateInputs[1], { target: { value: "" } });
    fireEvent.blur(dateInputs[1]);
    expect(onUpdate).toHaveBeenCalledWith(2, { deadline: null });
  });

  it("combines date and time when both are set", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<TodoTable {...defaultProps} onUpdate={onUpdate} />);
    const dateInputs = container.querySelectorAll<HTMLInputElement>('.col-date-input input');
    const timeInputs = container.querySelectorAll<HTMLInputElement>('.col-time-input input');

    const { fireEvent } = await import("@testing-library/react");
    // Set date first (display format with "/" → internal "-")
    fireEvent.change(dateInputs[0], { target: { value: "2026/07/01" } });
    fireEvent.blur(dateInputs[0]);
    expect(onUpdate).toHaveBeenCalledWith(1, { deadline: "2026-07-01T00:00" });

    onUpdate.mockClear();
    // Now set time
    fireEvent.change(timeInputs[0], { target: { value: "15:30" } });
    fireEvent.blur(timeInputs[0]);
    expect(onUpdate).toHaveBeenCalledWith(1, { deadline: "2026-07-01T15:30" });
  });
});

describe("TodoTable - overdue highlighting (US-011, US-012)", () => {
  it("shows overdue styling and !! in dedicated column when deadline is past", () => {
    const overdueTodos: Todo[] = [
      { id: 1, text: "超過タスク", status: "Not Started", categoryId: 1, deadline: "2020-01-01T00:00:00Z", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
    ];
    const { container } = render(<TodoTable {...defaultProps} todos={overdueTodos} />);
    const row = container.querySelector("tbody tr");
    expect(row).toHaveClass("row-overdue");
    // !! mark is in the dedicated overdue column, not replacing #
    expect(container.querySelector(".overdue-mark")).toHaveTextContent("!!");
    // Row number is still shown
    const numCells = container.querySelectorAll(".col-num");
    expect(numCells[1]).toHaveTextContent("1");
  });

  it("does not show overdue styling when status is Done", () => {
    const doneTodos: Todo[] = [
      { id: 1, text: "完了タスク", status: "Done", categoryId: 1, deadline: "2020-01-01T00:00:00Z", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
    ];
    const { container } = render(<TodoTable {...defaultProps} todos={doneTodos} />);
    const row = container.querySelector("tbody tr");
    expect(row).not.toHaveClass("row-overdue");
    expect(container.querySelector(".overdue-mark")).toBeNull();
  });

  it("does not show overdue styling when deadline is null", () => {
    const noDeadlineTodos: Todo[] = [
      { id: 1, text: "期限なし", status: "Not Started", categoryId: 1, deadline: null, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
    ];
    const { container } = render(<TodoTable {...defaultProps} todos={noDeadlineTodos} />);
    const row = container.querySelector("tbody tr");
    expect(row).not.toHaveClass("row-overdue");
    expect(container.querySelector(".overdue-mark")).toBeNull();
  });

  it("does not show overdue styling when deadline is in the future", () => {
    const futureTodos: Todo[] = [
      { id: 1, text: "未来タスク", status: "In Progress", categoryId: 1, deadline: "2099-12-31T23:59:00Z", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
    ];
    const { container } = render(<TodoTable {...defaultProps} todos={futureTodos} />);
    const row = container.querySelector("tbody tr");
    expect(row).not.toHaveClass("row-overdue");
    expect(container.querySelector(".overdue-mark")).toBeNull();
  });

  it("always shows row numbers even for overdue todos (US-012)", () => {
    const mixedTodos: Todo[] = [
      { id: 1, text: "超過", status: "Not Started", categoryId: 1, deadline: "2020-01-01T00:00:00Z", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
      { id: 2, text: "通常", status: "Not Started", categoryId: 1, deadline: null, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
    ];
    const { container } = render(<TodoTable {...defaultProps} todos={mixedTodos} />);
    const numCells = container.querySelectorAll(".col-num");
    // Skip thead th
    expect(numCells[1]).toHaveTextContent("1");
    expect(numCells[2]).toHaveTextContent("2");
    // Overdue column has !! only for first todo
    const overdueCells = container.querySelectorAll("td.col-overdue");
    expect(overdueCells[0].querySelector(".overdue-mark")).toHaveTextContent("!!");
    expect(overdueCells[1].querySelector(".overdue-mark")).toBeNull();
  });
});

describe("TodoTable - refresh button (US-014)", () => {
  it("renders refresh button when onRefresh is provided", () => {
    const onRefresh = vi.fn();
    render(<TodoTable {...defaultProps} onRefresh={onRefresh} />);
    expect(screen.getByTitle("リフレッシュ")).toBeInTheDocument();
  });

  it("does not render refresh button when onRefresh is not provided", () => {
    render(<TodoTable {...defaultProps} />);
    expect(screen.queryByTitle("リフレッシュ")).not.toBeInTheDocument();
  });

  it("calls onRefresh when refresh button is clicked", async () => {
    const onRefresh = vi.fn();
    render(<TodoTable {...defaultProps} onRefresh={onRefresh} />);
    await userEvent.click(screen.getByTitle("リフレッシュ"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("TodoTable - all mode grouping (US-007)", () => {
  const groupedTodos: TodoWithCategory[] = [
    { id: 1, text: "仕事タスク", status: "Not Started", categoryId: 1, deadline: null, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", category: { id: 1, name: "仕事" } },
    { id: 2, text: "仕事タスク2", status: "Done", categoryId: 1, deadline: null, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", category: { id: 1, name: "仕事" } },
    { id: 3, text: "私用タスク", status: "In Progress", categoryId: 2, deadline: null, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z", category: { id: 2, name: "私用" } },
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
