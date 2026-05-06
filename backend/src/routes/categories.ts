import { Hono } from "hono";
import { prisma } from "../db.js";

export const categoryRoutes = new Hono();

// GET /api/categories - 全カテゴリ取得 (Todo 件数付き)
categoryRoutes.get("/", async (c) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { todos: true } } },
    orderBy: { id: "asc" },
  });
  return c.json(categories);
});

// POST /api/categories - カテゴリ作成
categoryRoutes.post("/", async (c) => {
  const { name } = await c.req.json<{ name: string }>();
  const category = await prisma.category.create({ data: { name } });
  return c.json(category, 201);
});

// PUT /api/categories/:id - カテゴリ更新
categoryRoutes.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const { name } = await c.req.json<{ name: string }>();
  const category = await prisma.category.update({
    where: { id },
    data: { name },
  });
  return c.json(category);
});

// DELETE /api/categories/:id - カテゴリ削除 (紐づく Todo も Cascade 削除)
categoryRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await prisma.category.delete({ where: { id } });
  return c.json({ ok: true });
});
