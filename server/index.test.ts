/**
 * Elysia API Server Tests
 *
 * These tests verify that all API routes are correctly configured and functional.
 * They use Elysia's .handle() method to test routes directly without network calls.
 */

import { describe, expect, it, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { articleRoutes } from "./routes/article";

// Create test app with all routes
const createTestApp = () => {
  return new Elysia()
    .use(articleRoutes)
    .get("/health", () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }));
};

describe("Elysia API Server", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  describe("Health Check", () => {
    it("should return ok status", async () => {
      const response = await app.handle(new Request("http://localhost/health"));
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.status).toBe("ok");
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("Route Registration", () => {
    it("should register all expected routes", () => {
      // Get registered routes from the app
      const routes = app.routes;

      // Check article/auto route
      const articleAutoRoute = routes.find(
        (r) => r.path === "/api/article/auto" && r.method === "GET"
      );
      expect(articleAutoRoute).toBeDefined();

      // Check health route
      const healthRoute = routes.find(
        (r) => r.path === "/health" && r.method === "GET"
      );
      expect(healthRoute).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/unknown")
      );
      expect(response.status).toBe(404);
    });
  });
});
