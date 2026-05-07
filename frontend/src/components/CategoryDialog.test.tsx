import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryDialog } from "./CategoryDialog";
import type { Category } from "../types";

const categories: Category[] = [
  { id: 1, name: "仕事", createdAt: "", updatedAt: "", _count: { todos: 3 } },
  { id: 2, name: "私用", createdAt: "", updatedAt: "", _count: { todos: 0 } },
];

const defaultProps = {
  categories,
  showAllEnabled: false,
  onShowAllChange: vi.fn(),
  onAdd: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  onClose: vi.fn(),
};

describe("CategoryDialog", () => {
  it("renders dialog title and category list", () => {
    render(<CategoryDialog {...defaultProps} />);
    expect(screen.getByText("目的の管理")).toBeInTheDocument();
    expect(screen.getByText("仕事")).toBeInTheDocument();
    expect(screen.getByText("私用")).toBeInTheDocument();
  });

  it("shows todo count per category", () => {
    render(<CategoryDialog {...defaultProps} />);
    expect(screen.getByText("3件")).toBeInTheDocument();
    expect(screen.getByText("0件")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    render(<CategoryDialog {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when overlay clicked", async () => {
    const onClose = vi.fn();
    render(<CategoryDialog {...defaultProps} onClose={onClose} />);
    // Click the overlay (the outermost div)
    await userEvent.click(screen.getByText("目的の管理").closest(".overlay")!);
    expect(onClose).toHaveBeenCalled();
  });

  it("enters edit mode on category name click", async () => {
    render(<CategoryDialog {...defaultProps} />);
    await userEvent.click(screen.getByText("仕事"));
    expect(screen.getByDisplayValue("仕事")).toBeInTheDocument();
  });

  it("renders showAll checkbox unchecked when disabled", () => {
    render(<CategoryDialog {...defaultProps} showAllEnabled={false} />);
    const checkbox = screen.getByRole("checkbox", { name: "全件表示を許可する" });
    expect(checkbox).not.toBeChecked();
  });

  it("renders showAll checkbox checked when enabled", () => {
    render(<CategoryDialog {...defaultProps} showAllEnabled={true} />);
    const checkbox = screen.getByRole("checkbox", { name: "全件表示を許可する" });
    expect(checkbox).toBeChecked();
  });

  it("calls onShowAllChange when checkbox toggled", async () => {
    const onShowAllChange = vi.fn();
    render(<CategoryDialog {...defaultProps} onShowAllChange={onShowAllChange} />);
    const checkbox = screen.getByRole("checkbox", { name: "全件表示を許可する" });
    await userEvent.click(checkbox);
    expect(onShowAllChange).toHaveBeenCalledWith(true);
  });

  it("confirms before deleting category with todos", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CategoryDialog {...defaultProps} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByTitle("削除");
    await userEvent.click(deleteButtons[0]); // 仕事 (3件)

    expect(window.confirm).toHaveBeenCalledWith("3件の Todo も削除されます。よろしいですか?");
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("shows different confirm for category without todos", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CategoryDialog {...defaultProps} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByTitle("削除");
    await userEvent.click(deleteButtons[1]); // 私用 (0件)

    expect(window.confirm).toHaveBeenCalledWith("この目的を削除してよろしいですか?");
    expect(onDelete).toHaveBeenCalledWith(2);
  });
});
