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
// protobuf_loader.js lives at node_service/src/grpc/, so we need three
// levels up to reach the repo root: grpc/ -> src/ -> node_service/ -> repo_root/.
const PROTO_PATH = process.env.PROTO_PATH || path.join(REPO_ROOT, 'protos', 'compilation.proto');

log.info(`Sync-loading Protobuf compilation contracts from: ${PROTO_PATH}`);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const jasonProto = grpc.loadPackageDefinition(packageDefinition).jason;

const pythonHost = process.env.PYTHON_SERVICE_HOST || 'localhost';
const pythonPort = process.env.PYTHON_SERVICE_PORT || '50051';

log.info(`Connecting to Python core service. Binding channel address: ${pythonHost}:${pythonPort}`);

export const grpcClient = new jasonProto.ChartCompilation(
  `${pythonHost}:${pythonPort}`,
  grpc.credentials.createInsecure()
);