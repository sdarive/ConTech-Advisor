import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// This logging middleware is fine for both dev and prod
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err); // Log the full error in production
  });

  // --- THIS IS THE KEY CHANGE ---
  // Use a simple check for the NODE_ENV to decide how to run
  if (process.env.NODE_ENV === "development") {
    // In development, use Vite for HMR
    await setupVite(app, server);
  } else {
    // In production, serve the built static files directly
    const distPath = path.resolve(__dirname, 'public');
    if (!fs.existsSync(distPath)) {
        console.error(`Could not find the build directory: ${distPath}. Make sure to build the client first.`);
        process.exit(1);
    }
    app.use(express.static(distPath));
    // Fallback to index.html for single-page applications
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
  // --- END OF KEY CHANGE ---

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`Server listening on http://0.0.0.0:${port}`);
  });
})();