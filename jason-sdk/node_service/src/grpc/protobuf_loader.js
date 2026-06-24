import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('protobuf-loader');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the proto file relative to this source file (NOT the CWD), so it
// works inside Docker where CWD is typically /app/node_service but the proto
// lives at repo-root/protos/compilation.proto. This file is at
// node_service/src/grpc/protobuf_loader.js -> ../.. reaches repo root.
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const PROTO_PATH = process.env.PROTO_PATH || path.join(REPO_ROOT, 'protos', 'compilation.proto');

let grpcClient = null;

try {
  log.info(`Sync-loading Protobuf compilation contracts from: ${PROTO_PATH}`);

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const jasonProto = grpc.loadPackageDefinition(packageDefinition).jason;

  if (!jasonProto || !jasonProto.ChartCompilation) {
    throw new Error('Failed to load ChartCompilation service from proto definition. Check compilation.proto.');
  }

  const pythonHost = process.env.PYTHON_SERVICE_HOST || 'localhost';
  const pythonPort = process.env.PYTHON_SERVICE_PORT || '50051';

  log.info(`Connecting to Python core service. Binding channel address: ${pythonHost}:${pythonPort}`);

  grpcClient = new jasonProto.ChartCompilation(
    `${pythonHost}:${pythonPort}`,
    grpc.credentials.createInsecure()
  );
} catch (err) {
  log.error(`Failed to initialize gRPC client: ${err.message}. The service will start but gRPC calls will fail.`);
  // Create a stub client that throws on any call, so the web gateway still
  // starts and can serve health checks even when the Python service is down.
  grpcClient = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'RequestChartCompilation') {
        return (_req, callback) => {
          callback(new Error('gRPC client not initialized. Proto loading failed at startup.'), null);
        };
      }
      return undefined;
    }
  });
}

export { grpcClient };
