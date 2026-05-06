import { Hono } from "hono";
import { cors } from "hono/cors";
import { categoryRoutes } from "./routes/categories.js";
import { todoRoutes } from "./routes/todos.js";

export const app = new Hono();

app.use("/*", cors());

app.route("/api/categories", categoryRoutes);
app.route("/api/todos", todoRoutes);

app.get("/api/health", (c) => c.json({ status: "ok" }));
