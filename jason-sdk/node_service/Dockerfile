# Jason SDK - Node.js Orchestrator
#
# Builds the Express + gRPC web gateway that accepts REST compilation
# requests and delegates the heavy chart/diagram work to the Python
# core service over gRPC.

FROM node:20-bookworm-slim

# Install system utilities needed by the runtime (wget is used by the
# docker-compose healthcheck; curl is a nice-to-have for in-container
# debugging).
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create the application directory.
WORKDIR /app

# Copy the Node service source first so we can install dependencies
# without re-copying them on every source change.
COPY node_service/package.json node_service/package-lock.json* ./node_service/

# Install production dependencies.
RUN cd node_service && npm install --omit=dev --no-audit --no-fund

# Copy the rest of the Node service source.
COPY node_service/ ./node_service/

# Copy the shared protos and JSON schemas that the Node service reads
# at runtime. The source files resolve these paths relative to the
# repo root, so they MUST exist inside the container at /app/protos
# and /app/shared_schemas.
COPY protos/ ./protos/
COPY shared_schemas/ ./shared_schemas/

# Ensure the shared workspace exists (used by the REST endpoint for
# per-run extraction directories).
RUN mkdir -p /tmp/jason_workspace

# Run the Node service from its own directory so any relative paths
# inside node_modules resolve correctly.
WORKDIR /app/node_service

ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHON_SERVICE_HOST=jason-core
ENV PYTHON_SERVICE_PORT=50051
ENV JASON_WORKSPACE=/tmp/jason_workspace

EXPOSE 3000

# Health check: verify Express is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["wget", "-qO-", "http://localhost:3000/health"]

# Express listens on PORT (default 3000). The process runs in the
# foreground so Docker can manage its lifecycle.
CMD ["node", "src/index.js"]
