import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../app.js";

// Mock Prisma
vi.mock("../db.js", () => {
  const mockPrisma = {
    todo: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../db.js";
const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/todos", () => {
  it("returns todos filtered by categoryId", async () => {
    const data = [
      { id: 1, text: "タスクA", status: "Not Started", categoryId: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockPrisma.todo.findMany.mockResolvedValue(data as never);

    const res = await app.request("/api/todos?categoryId=1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].text).toBe("タスクA");
    expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
      where: { categoryId: 1 },
      orderBy: { id: "asc" },
    });
  });

  it("returns all todos with category info when categoryId is omitted (US-007)", async () => {
    const data = [
      { id: 1, text: "タスクA", status: "Not Started", categoryId: 1, createdAt: new Date(), updatedAt: new Date(), category: { id: 1, name: "仕事" } },
      { id: 2, text: "タスクB", status: "Done", categoryId: 2, createdAt: new Date(), updatedAt: new Date(), category: { id: 2, name: "私用" } },
    ];
    mockPrisma.todo.findMany.mockResolvedValue(data as never);

    const res = await app.request("/api/todos");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].category.name).toBe("仕事");
    expect(body[1].category.name).toBe("私用");
    expect(mockPrisma.todo.findMany).toHaveBeenCalledWith({
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ categoryId: "asc" }, { id: "asc" }],
    });
  });
});

describe("POST /api/todos", () => {
  it("creates a new todo", async () => {
    const created = { id: 1, text: "新しいタスク", status: "Not Started", categoryId: 1, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.todo.create.mockResolvedValue(created as never);

    const res = await app.request("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "新しいタスク", categoryId: 1 }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.text).toBe("新しいタスク");
    expect(body.status).toBe("Not Started");
    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
      data: { text: "新しいタスク", categoryId: 1 },
    });
  });

  it("creates a todo with deadline (US-008)", async () => {
    const deadline = new Date("2026-06-01T09:00:00Z");
    const created = { id: 2, text: "期限付き", status: "Not Started", categoryId: 1, deadline, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.todo.create.mockResolvedValue(created as never);

    const res = await app.request("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "期限付き", categoryId: 1, deadline: "2026-06-01T09:00:00Z" }),
    });

    expect(res.status).toBe(201);
    expect(mockPrisma.todo.create).toHaveBeenCalledWith({
      data: { text: "期限付き", categoryId: 1, deadline: expect.any(Date) },
    });
  });
});

describe("PUT /api/todos/:id", () => {
  it("updates todo text", async () => {
    const updated = { id: 1, text: "修正後", status: "Not Started", categoryId: 1, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.todo.update.mockResolvedValue(updated as never);

    const res = await app.request("/api/todos/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "修正後" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe("修正後");
    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { text: "修正後" },
    });
  });

  it("updates todo status", async () => {
    const updated = { id: 1, text: "タスク", status: "Done", categoryId: 1, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.todo.update.mockResolvedValue(updated as never);

    const res = await app.request("/api/todos/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Done" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("Done");
    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: "Done" },
    });
  });

  it("sets deadline on a todo (US-008)", async () => {
    const deadline = new Date("2026-06-15T14:30:00Z");
    const updated = { id: 1, text: "タスク", status: "Not Started", categoryId: 1, deadline, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.todo.update.mockResolvedValue(updated as never);

    const res = await app.request("/api/todos/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: "2026-06-15T14:30:00Z" }),
    });

    expect(res.status).toBe(200);
    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { deadline: expect.any(Date) },
    });
  });

  it("clears deadline by setting null (US-008)", async () => {
    const updated = { id: 1, text: "タスク", status: "Not Started", categoryId: 1, deadline: null, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.todo.update.mockResolvedValue(updated as never);

    const res = await app.request("/api/todos/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: null }),
    });

    expect(res.status).toBe(200);
    expect(mockPrisma.todo.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { deadline: null },
    });
  });
});

describe("DELETE /api/todos/:id", () => {
  it("deletes todo and returns ok", async () => {
    mockPrisma.todo.delete.mockResolvedValue({} as never);

    const res = await app.request("/api/todos/1", { method: "DELETE" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockPrisma.todo.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
