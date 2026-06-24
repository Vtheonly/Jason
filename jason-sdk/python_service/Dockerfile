# Jason SDK - Python Core Engine
#
# Builds the gRPC server that handles chart/Excel compilation, native
# Morph transition pre-processing, and (optionally) PDF/PNG/MP4 export.
# The Node orchestrator talks to this container over port 50051.

FROM python:3.11-slim-bookworm

# Install system dependencies:
#  - libreoffice + poppler-utils: PPTX -> PDF -> PNG rasterization
#  - ffmpeg: kinetic video synthesis
#  - build-essential + python3-dev: needed to compile grpcio / Pillow wheels
#  - wget: useful for in-container debugging
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        python3-dev \
        libreoffice-core \
        libreoffice-impress \
        poppler-utils \
        ffmpeg \
        wget \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (better layer caching).
COPY python_service/requirements.txt ./python_service/requirements.txt
RUN pip install --no-cache-dir -r python_service/requirements.txt

# Copy the Python service source.
COPY python_service/ ./python_service/

# Copy the shared protobuf definitions and generate the gRPC stubs
# inside the python_service directory so `import compilation_pb2`
# resolves correctly at runtime.
COPY protos/ ./protos/
RUN cd python_service \
    && python -m grpc_tools.protoc \
        -I../protos \
        --python_out=. \
        --grpc_python_out=. \
        ../protos/compilation.proto

# Ensure the shared workspace exists.
RUN mkdir -p /tmp/jason_workspace

WORKDIR /app/python_service

ENV GRPC_PORT=50051
ENV LOG_LEVEL=INFO
ENV PYTHONUNBUFFERED=1

EXPOSE 50051

CMD ["python", "server.py"]
