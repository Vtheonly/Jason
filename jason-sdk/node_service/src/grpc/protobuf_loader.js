import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('protobuf-loader');
const PROTO_PATH = path.resolve('../protos/compilation.proto');

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