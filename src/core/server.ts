import { startTracing, stopTracing } from "./tracing.js";

startTracing();

const [{ buildApp }, { config }] = await Promise.all([
  import("./app.js"),
  import("./config.js"),
]);

const app = await buildApp();

const shutdown = async (signal: string): Promise<void> => {
  app.log.info({ signal }, "Shutdown signal received, closing server");
  try {
    await app.close();
    await stopTracing();
    app.log.info("Server closed gracefully");
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  const address = await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info({ address }, "Server listening");
} catch (err) {
  app.log.error({ err }, "Failed to start server");
  process.exit(1);
}
