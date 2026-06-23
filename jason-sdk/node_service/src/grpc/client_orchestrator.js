import { grpcClient } from './protobuf_loader.js';
import { createScopedLogger } from '../developer_experience/logger.js';

const log = createScopedLogger('client-orchestrator');

export function executeChartCompilation(extractionPath, chartsData, themeData = {}, transitionsData = {}) {
  return new Promise((resolve, reject) => {
    log.info('Packaging data parameters for RPC transmission over client gateway.');

    const requestPayload = {
      extraction_path: extractionPath,
      chart_data_payload: JSON.stringify(chartsData),
      theme_payload: JSON.stringify(themeData),
      transition_payload: JSON.stringify(transitionsData)
    };

    grpcClient.RequestChartCompilation(requestPayload, (err, response) => {
      if (err) {
        log.error(`gRPC client compilation execution run failed. Raw message: ${err.message}`, err);
        return reject(err);
      }

      if (!response.success) {
        log.error(`gRPC computation core pipeline error: ${response.message}`);
        return reject(new Error(response.message));
      }

      log.info('gRPC compilation execution completed successfully. Caches synchronized.');
      resolve(response);
    });
  });
}