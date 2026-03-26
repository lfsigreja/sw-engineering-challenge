import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { config } from "./config.js";

let sdk: NodeSDK | undefined;

export function startTracing(): void {
  const exporterOptions = config.OTEL_EXPORTER_OTLP_ENDPOINT
    ? { url: `${config.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` }
    : {};

  sdk = new NodeSDK({
    serviceName: "sw-engineering-challenge",
    traceExporter: new OTLPTraceExporter(exporterOptions),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();
}

export async function stopTracing(): Promise<void> {
  await sdk?.shutdown();
}
