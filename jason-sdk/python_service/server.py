import os
import sys
import json
import logging
import signal
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

# Global server reference for graceful shutdown
_server = None

class PresentationEngineServicer(compilation_pb2_grpc.ChartCompilationServicer):
    
    def RequestChartCompilation(self, request, context):
        try:
            extraction_path = request.extraction_path
            chart_payload_str = request.chart_data_payload
            theme_payload_str = request.theme_payload
            transition_payload_str = request.transition_payload

            logger.info(f"gRPC compilation connection established. Targeting extraction path: {extraction_path}")

            # Validate extraction_path exists
            if not extraction_path or not os.path.exists(extraction_path):
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details(f"Extraction path does not exist: {extraction_path}")
                return compilation_pb2.CompilationResponse(
                    success=False,
                    message=f"Invalid extraction path: {extraction_path}",
                    errors=[compilation_pb2.ErrorDetail(
                        code="INVALID_PATH",
                        field="extraction_path",
                        message=f"Extraction path does not exist: {extraction_path}",
                        location="RequestChartCompilation"
                    )]
                )

            chart_payload = json.loads(chart_payload_str) if chart_payload_str else []
            theme_payload = json.loads(theme_payload_str) if theme_payload_str else {}
            transition_payload = json.loads(transition_payload_str) if transition_payload_str else {}

            error_details = []

            # Note: Morph transition tagging is already applied by the Node-side
            # kineticEngine before the gRPC call. We skip re-applying here to
            # avoid double-processing (the keyword would no longer match anyway
            # since it's already been replaced with !!jason_morph_<id> tags).
            # If this service is used standalone (without Node), uncomment below:
            # if transition_payload:
            #     apply_native_morph_pre_processing(extraction_path, transition_payload)

            # Process Excel formulas and charts mapping logic
            if chart_payload:
                logger.info(f"Initializing excel worksheet compiler for {len(chart_payload)} charts.")
                orchestrator = ChartOrchestrator(extraction_path)
                for chart_config in chart_payload:
                    slide_idx = chart_config.get("slide_index")
                    chart_idx = chart_config.get("chart_index")
                    dataset = chart_config.get("dataset")
                    try:
                        orchestrator.compile_slide_charts(slide_idx, chart_idx, dataset)
                    except Exception as chart_err:
                        logger.error(f"Chart compilation failed for slide {slide_idx}, chart {chart_idx}: {str(chart_err)}")
                        error_details.append(compilation_pb2.ErrorDetail(
                            code="CHART_COMPILE_FAILED",
                            field=f"slide_{slide_idx}_chart_{chart_idx}",
                            message=str(chart_err),
                            location="ChartOrchestrator.compile_slide_charts"
                        ))

            return compilation_pb2.CompilationResponse(
                success=True,
                message="Visual components, math models, and sheet updates processed successfully.",
                errors=error_details
            )

        except Exception as err:
            logger.error(f"gRPC Core compilation pipeline failed: {str(err)}", exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(err))
            return compilation_pb2.CompilationResponse(
                success=False,
                message=f"Python Core compile failure: {str(err)}",
                errors=[compilation_pb2.ErrorDetail(
                    code="PIPELINE_FAILURE",
                    field="unknown",
                    message=str(err),
                    location="RequestChartCompilation"
                )]
            )

def _handle_shutdown(signum, frame):
    """Gracefully stop the gRPC server on SIGTERM/SIGINT."""
    signal_name = 'SIGTERM' if signum == signal.SIGTERM else 'SIGINT'
    logger.info(f"Received {signal_name}. Initiating graceful shutdown...")
    if _server:
        # Stop accepting new RPCs, then wait for in-flight RPCs to finish
        _server.stop(grace=5)  # 5-second grace period
        logger.info("gRPC server stopped gracefully.")

def serve():
    global _server
    port = os.getenv("GRPC_PORT", "50051")
    _server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        options=[
            ('grpc.max_receive_message_length', 50 * 1024 * 1024),  # 50MB max request
            ('grpc.max_send_message_length', 50 * 1024 * 1024),      # 50MB max response
        ]
    )
    compilation_pb2_grpc.add_ChartCompilationServicer_to_server(PresentationEngineServicer(), _server)
    _server.add_insecure_port(f"[::]:{port}")
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGTERM, _handle_shutdown)
    signal.signal(signal.SIGINT, _handle_shutdown)
    
    logger.info(f"Python Core Engine active and listening on port: {port}")
    _server.start()
    _server.wait_for_termination()

if __name__ == "__main__":
    serve()
