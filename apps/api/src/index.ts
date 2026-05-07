import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";

async function bootstrap() {
  const app = express();

  app.use(
    cors({
      origin: env.webOrigin,
      credentials: true
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "api", timestamp: new Date().toISOString() });
  });

  app.use("/api", apiRouter);

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ message: "Hệ thống tạm thời gián đoạn." });
  });

  app.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap API:", error);
  process.exit(1);
});
