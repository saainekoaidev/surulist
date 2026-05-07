import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../app.js";

// Mock Prisma
vi.mock("../db.js", () => {
  const mockPrisma = {
    category: {
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

describe("GET /api/categories", () => {
  it("returns all categories with todo count", async () => {
    const data = [
      { id: 1, name: "仕事", createdAt: new Date(), updatedAt: new Date(), _count: { todos: 3 } },
      { id: 2, name: "私用", createdAt: new Date(), updatedAt: new Date(), _count: { todos: 0 } },
    ];
    mockPrisma.category.findMany.mockResolvedValue(data as never);

    const res = await app.request("/api/categories");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe("仕事");
    expect(body[0]._count.todos).toBe(3);
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
      include: { _count: { select: { todos: true } } },
      orderBy: { id: "asc" },
    });
  });

  it("returns empty array when no categories", async () => {
    mockPrisma.category.findMany.mockResolvedValue([]);

    const res = await app.request("/api/categories");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

describe("POST /api/categories", () => {
  it("creates a new category", async () => {
    const created = { id: 1, name: "新規目的", createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.category.create.mockResolvedValue(created as never);

    const res = await app.request("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "新規目的" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("新規目的");
    expect(mockPrisma.category.create).toHaveBeenCalledWith({
      data: { name: "新規目的" },
    });
  });
});

describe("PUT /api/categories/:id", () => {
  it("updates category name", async () => {
    const updated = { id: 1, name: "変更後", createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.category.update.mockResolvedValue(updated as never);

    const res = await app.request("/api/categories/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "変更後" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("変更後");
    expect(mockPrisma.category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "変更後" },
    });
  });
});

describe("DELETE /api/categories/:id", () => {
  it("deletes category and returns ok", async () => {
    mockPrisma.category.delete.mockResolvedValue({} as never);

    const res = await app.request("/api/categories/1", { method: "DELETE" });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
