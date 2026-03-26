import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { BloqJsonRepository } from "../modules/bloqs/infra/bloq.json-repository.js";
import { registerBloqRoutes } from "../modules/bloqs/infra/bloq.routes.js";
import { LockerJsonRepository } from "../modules/lockers/infra/locker.json-repository.js";
import { registerLockerRoutes } from "../modules/lockers/infra/locker.routes.js";
import { RentJsonRepository } from "../modules/rents/infra/rent.json-repository.js";
import { registerRentRoutes } from "../modules/rents/infra/rent.routes.js";
import { JsonStore } from "../shared/infrastructure/json-store.js";
import { config } from "./config.js";
import { registerCorrelationId } from "./plugins/correlation-id.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { registerMetrics } from "./plugins/metrics.js";
import { registerRateLimit } from "./plugins/rate-limit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");

const packageVersion = await readFile(
  path.resolve(process.cwd(), "package.json"),
  "utf8",
).then((raw) => (JSON.parse(raw) as { version: string }).version);

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(config.NODE_ENV !== "production"
        ? { transport: { target: "pino-pretty", options: { colorize: true } } }
        : {}),
    },
  });

  registerErrorHandler(app);
  registerCorrelationId(app);
  registerMetrics(app);
  await registerRateLimit(app);

  const store = new JsonStore(dataDir);
  const bloqRepo = new BloqJsonRepository(store);
  const lockerRepo = new LockerJsonRepository(store);
  const rentRepo = new RentJsonRepository(store);

  app.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime(),
  }));

  app.get("/ready", async (_request, reply) => {
    const probeFile = path.join(dataDir, ".ready-probe");
    try {
      await writeFile(probeFile, "ok", "utf8");
      await unlink(probeFile);
    } catch {
      return reply.status(503).send({
        status: "not_ready",
        reason: "data directory not writable",
      });
    }
    return { status: "ready", version: packageVersion };
  });

  registerBloqRoutes(app, bloqRepo, lockerRepo);
  registerLockerRoutes(app, lockerRepo, bloqRepo, rentRepo);
  registerRentRoutes(app, rentRepo, lockerRepo);

  return app;
}
