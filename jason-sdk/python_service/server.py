import os
import sys
import json
import logging
from concurrent import futures
import grpc

# Add source directory to standard systems paths
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

import compilation_pb2
import compilation_pb2_grpc
from charts.chart_orchestrator import ChartOrchestrator
from kinetic_engine.morph_engine import apply_native_morph_pre_processing

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("jason-grpc-server")

class PresentationEngineServicer(compilation_pb2_grpc.ChartCompilationServicer):
    
    def RequestChartCompilation(self, request, context):
        try:
            extraction_path = request.extraction_path
            chart_payload_str = request.chart_data_payload
            theme_payload_str = request.theme_payload
            transition_payload_str = request.transition_payload

            logger.info(f"gRPC compilation connection established. Targeting extraction path: {extraction_path}")

            chart_payload = json.loads(chart_payload_str) if chart_payload_str else []
            theme_payload = json.loads(theme_payload_str) if theme_payload_str else {}
            transition_payload = json.loads(transition_payload_str) if transition_payload_str else {}

            # Execute native PPTX morphological matching optimizations
            if transition_payload:
                logger.info("Executing transition morph mappings optimization.")
                apply_native_morph_pre_processing(extraction_path, transition_payload)

            # Process Excel formulas and charts mapping logic
            if chart_payload:
                logger.info(f"Initializing excel worksheet compiler for {len(chart_payload)} charts.")
                orchestrator = ChartOrchestrator(extraction_path)
                for chart_config in chart_payload:
                    slide_idx = chart_config.get("slide_index")
                    chart_idx = chart_config.get("chart_index")
                    dataset = chart_config.get("dataset")
                    orchestrator.compile_slide_charts(slide_idx, chart_idx, dataset)

            return compilation_pb2.CompilationResponse(
                success=True,
                message="Visual components, math models, and sheet updates processed successfully."
            )

        except Exception as err:
            logger.error(f"gRPC Core compilation pipeline failed: {str(err)}", exc_info=True)
            return compilation_pb2.CompilationResponse(
                success=False,
                message=f"Python Core compile failure: {str(err)}"
            )

def serve():
    port = os.getenv("GRPC_PORT", "50051")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    compilation_pb2_grpc.add_ChartCompilationServicer_to_server(PresentationEngineServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    logger.info(f"Python Core Engine active and listening on port: {port}")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    serve()