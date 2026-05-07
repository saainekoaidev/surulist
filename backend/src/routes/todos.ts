import { Hono } from "hono";
import { prisma } from "../db.js";

export const todoRoutes = new Hono();

// GET /api/todos?categoryId=N - カテゴリに属する Todo 一覧
// categoryId 省略時は全 Todo を category 情報付きで返却
todoRoutes.get("/", async (c) => {
  const categoryIdParam = c.req.query("categoryId");

  if (categoryIdParam != null && categoryIdParam !== "") {
    const categoryId = Number(categoryIdParam);
    const todos = await prisma.todo.findMany({
      where: { categoryId },
      orderBy: { id: "asc" },
    });
    return c.json(todos);
  }

  const todos = await prisma.todo.findMany({
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ categoryId: "asc" }, { id: "asc" }],
  });
  return c.json(todos);
});

// POST /api/todos - Todo 作成
todoRoutes.post("/", async (c) => {
  const { text, categoryId } = await c.req.json<{
    text: string;
    categoryId: number;
  }>();
  const todo = await prisma.todo.create({
    data: { text, categoryId },
  });
  return c.json(todo, 201);
});

// PUT /api/todos/:id - Todo 更新 (text / status)
todoRoutes.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ text?: string; status?: string }>();
  const todo = await prisma.todo.update({
    where: { id },
    data: body,
  });
  return c.json(todo);
});

// DELETE /api/todos/:id - Todo 削除
todoRoutes.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await prisma.todo.delete({ where: { id } });
  return c.json({ ok: true });
});
