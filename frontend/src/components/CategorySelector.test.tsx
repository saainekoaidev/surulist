import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategorySelector } from "./CategorySelector";
import type { Category } from "../types";

const categories: Category[] = [
  { id: 1, name: "仕事", createdAt: "", updatedAt: "", _count: { todos: 3 } },
  { id: 2, name: "私用", createdAt: "", updatedAt: "", _count: { todos: 1 } },
];

describe("CategorySelector", () => {
  it("renders category options", () => {
    render(
      <CategorySelector
        categories={categories}
        selectedId={1}
        showAllEnabled={false}
        onSelect={vi.fn()}
        onEditClick={vi.fn()}
        onAddTodoClick={vi.fn()}
      />
    );
    expect(screen.getByRole("option", { name: "仕事" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "私用" })).toBeInTheDocument();
  });

  it("shows placeholder when no categories", () => {
    render(
      <CategorySelector
        categories={[]}
        selectedId={null}
        showAllEnabled={false}
        onSelect={vi.fn()}
        onEditClick={vi.fn()}
        onAddTodoClick={vi.fn()}
      />
    );
    expect(screen.getByRole("option", { name: "-- 目的を追加してください --" })).toBeInTheDocument();
  });

  it("shows (全て) option when showAllEnabled is true", () => {
    render(
      <CategorySelector
        categories={categories}
        selectedId={1}
        showAllEnabled={true}
        onSelect={vi.fn()}
        onEditClick={vi.fn()}
        onAddTodoClick={vi.fn()}
      />
    );
    expect(screen.getByRole("option", { name: "(全て)" })).toBeInTheDocument();
  });

  it("hides (全て) option when showAllEnabled is false", () => {
    render(
      <CategorySelector
        categories={categories}
        selectedId={1}
        showAllEnabled={false}
        onSelect={vi.fn()}
        onEditClick={vi.fn()}
        onAddTodoClick={vi.fn()}
      />
    );
    expect(screen.queryByRole("option", { name: "(全て)" })).not.toBeInTheDocument();
  });

  it("calls onSelect with category id when selected", async () => {
    const onSelect = vi.fn();
    render(
      <CategorySelector
        categories={categories}
        selectedId={1}
        showAllEnabled={false}
        onSelect={onSelect}
        onEditClick={vi.fn()}
        onAddTodoClick={vi.fn()}
      />
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "2");
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("calls onSelect with 'all' when (全て) is selected", async () => {
    const onSelect = vi.fn();
    render(
      <CategorySelector
        categories={categories}
        selectedId={1}
        showAllEnabled={true}
        onSelect={onSelect}
        onEditClick={vi.fn()}
        onAddTodoClick={vi.fn()}
      />
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "all");
    expect(onSelect).toHaveBeenCalledWith("all");
  });

  it("disables add button when selectedId is null", () => {
    render(
      <CategorySelector
        categories={categories}
        selectedId={null}
        showAllEnabled={false}
        onSelect={vi.fn()}
        onEditClick={vi.fn()}
        onAddTodoClick={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "+ 新規追加" })).toBeDisabled();
  });

  it("disables add button when 'all' is selected", () => {
    render(
      <CategorySelector
        categories={categories}
        selectedId="all"
        showAllEnabled={true}
        onSelect={vi.fn()}
        onEditClick={vi.fn()}
        onAddTodoClick={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "+ 新規追加" })).toBeDisabled();
  });

  it("calls onEditClick when edit button clicked", async () => {
    const onEditClick = vi.fn();
    render(
      <CategorySelector
        categories={categories}
        selectedId={1}
        showAllEnabled={false}
        onSelect={vi.fn()}
        onEditClick={onEditClick}
        onAddTodoClick={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "編集" }));
    expect(onEditClick).toHaveBeenCalledOnce();
  });
});
