# Jason SDK

A dual-runtime (Node.js + Python) platform that compiles structured JSON configurations into high-fidelity PowerPoint presentations, PDF packages, and MP4 transition videos.

## Architecture

```
                  +-----------------------------+
   REST / CLI --> |    Node.js Orchestrator     |
                  |  (Express + Ajv + gRPC)     |
                  +--------------+--------------+
                                 |
                          gRPC (port 50051)
                                 |
                  +--------------v--------------+
                  |     Python Core Engine       |
                  | (python-pptx, openpyxl,      |
                  |  LibreOffice, FFmpeg)        |
                  +-----------------------------+
```

The Node service exposes a REST endpoint (`POST /api/generate`) and a CLI (`npm run cli`). It parses JSON configurations, validates them against JSON schemas, and interpolates mustache-style placeholders into a PPTX template. The Python service handles native chart/Excel updates, Morph transitions, PDF/PNG/MP4 export, and any other operations that require direct manipulation of OOXML or system-level media tools.

Both services share a workspace volume (`/tmp/jason_workspace`) so that extraction directories produced by Node are visible to Python without copying binary blobs over gRPC.

## Quick start (Docker Compose)

```bash
# Build and start both containers in detached mode
docker-compose up --build -d

# Verify they are running
docker-compose ps

# Tail logs
docker-compose logs -f
```

Once the containers are healthy:

- Node web gateway: `http://localhost:3000`
  - `GET /` - landing page
  - `GET /health` - liveness probe
  - `POST /api/generate` - compile a PPTX (multipart upload)
- Python gRPC core: `localhost:50051`

### Compile a presentation via REST

```bash
curl -X POST http://localhost:3000/api/generate \
  -F "template=@./templates/demo_template.pptx" \
  -F "config=@./sample_data/demo_presentation.json" \
  --output ./output/compiled.pptx
```

### Compile a presentation via CLI (inside the Node container)

```bash
docker-compose exec jason-web sh
cd /app/node_service
npm run cli -- \
  --input /app/sample_data/demo_presentation.json \
  --template /app/templates/demo_template.pptx \
  --output /tmp/jason_workspace/compiled.pptx
```

## Local (bare-metal) setup

### Prerequisites

- Node.js >= 20.0.0
- Python >= 3.11
- LibreOffice (headless), poppler-utils, FFmpeg - only required for PDF/PNG/MP4 export

### Install and run

```bash
# Node service
cd node_service
npm install
npm start        # starts the Express gateway on port 3000

# Python service (separate terminal)
cd python_service
pip install -r requirements.txt
# Generate the gRPC stubs from the proto definitions
python -m grpc_tools.protoc -I../protos --python_out=. --grpc_python_out=. ../protos/compilation.proto
python server.py # starts the gRPC server on port 50051
```

## Repository layout

```
jason-sdk/
├── docker-compose.yml         # Compose file for the two-container stack
├── package.json               # Top-level project metadata
├── requirements.txt           # Re-exports python_service/requirements.txt
├── protos/
│   ├── compilation.proto      # gRPC contract for chart/diagram compilation
│   └── kinetic.proto          # Reserved for future kinetic RPCs
├── shared_schemas/            # JSON Schemas loaded by the Node validator
│   ├── presentation_schema.json
│   ├── theme_schema.json
│   ├── transition_schema.json
│   └── fyp_schema.json
├── node_service/              # Express + gRPC orchestrator
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js           # Express REST gateway (POST /api/generate)
│       ├── cli/               # CLI entry point (npm run cli)
│       ├── input_system/      # Folder scanning, $ref resolution, config merging
│       ├── config/            # Schema validator + presentation constants
│       ├── template_engine/   # {{mustache}} / {{#each}} / {{#if}} compiler
│       ├── typography/        # Markdown -> PPTX runs, bullet formatting
│       ├── interactivity/     # Branching / hyperlinks / agenda builders
│       ├── core/              # Native PPTX morph transition pre-processor
│       ├── grpc/              # gRPC client to the Python core
│       ├── quality_control/   # Margin / contrast / overcrowding audits
│       └── developer_experience/  # Logger, plugin manager, debug preview
├── python_service/            # gRPC core drawing + chart + media engine
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── server.py              # gRPC server bootstrap
│   └── src/
│       ├── core_canvas/       # Coordinate math, shape generator, z-order
│       ├── theme_engine/      # Colors, gradients, glassmorphism, fonts
│       ├── layout_engine/     # Bento / split-screen / timeline / comparison
│       ├── content_types/     # KPI cards, callouts, quotes, tables, lists
│       ├── charts/            # Native chart + embedded Excel updater
│       ├── diagrams/          # Flowchart / UML / ER / network / pipeline
│       ├── kinetic_engine/    # Morph XML manager, slide rasterizer, video
│       ├── export_pipeline/   # PPTX -> PDF -> PNG -> outline
│       ├── automation_intel/  # Auto-splitter, whitespace balancer, captions
│       ├── quality_checks/    # Design rules, resolution, print safety
│       ├── slides_builder/    # High-level slide builders (title, agenda, ...)
│       └── fyp_templates/     # Academic defense specialized slides
├── sample_data/
│   └── demo_presentation.json # Sample config used by the REST / CLI demo
├── templates/
│   └── demo_template.pptx     # Sample PPTX template with placeholders
└── sample_assets/             # Drop images / fonts / icons here
```

## Configuration reference

See `shared_schemas/presentation_schema.json` for the full JSON Schema. The minimal required fields are:

```json
{
  "slides": [
    { "title": "Slide title" }
  ]
}
```

Each slide may declare any of:

| Field           | Type     | Description                                              |
|-----------------|----------|----------------------------------------------------------|
| `slide_index`   | integer  | Position in the final deck (0-indexed).                  |
| `title`         | string   | Slide title (required).                                  |
| `subtitle`      | string   | Optional subtitle.                                       |
| `layout`        | string   | One of: `title`, `agenda`, `hero`, `split_screen`, `bento_grid`, `timeline`, `comparison`, `academic_results`. |
| `markdown_body` | string   | Markdown body (supports `**bold**`, `*italic*`, `` `code` ``). |
| `bullets`       | string[] | Bullet list items.                                       |
| `speaker_notes` | string   | Speaker notes attached to the slide.                     |
| `charts`        | object[] | Native charts (see schema for details).                 |
| `diagrams`      | object[] | Flowcharts / UML / sequence / network diagrams.          |

## Extending the SDK

- **Custom mustache filter**: add a `case` in `node_service/src/template_engine/pipeline_filters.js`. Use as `{{value \| myFilter(arg)}}`.
- **Custom shape**: add a method to `python_service/src/core_canvas/shape_generator.py`.
- **Custom diagram**: register a new branch in `python_service/src/diagrams/diagram_orchestrator.py` and implement the drawing routine under `python_service/src/diagrams/`.
- **Custom slide builder**: add a new module under `python_service/src/slides_builder/` and export it from `__init__.py`.

## Troubleshooting

- **`ECONNREFUSED 50051`**: the Python container did not start. Check `docker-compose logs jason-core`. The Node service will still compile the PPTX without chart/Excel updates, but logs a warning.
- **`Schema validation failed`**: compare your config against `shared_schemas/presentation_schema.json`. Common issues are missing `title` or an unrecognized `layout` value.
- **`Template PPTX archive missing`**: ensure the `.pptx` file you upload is a valid Office Open XML archive (a zip) and not a `.ppt` legacy binary.
- **LibreOffice hangs in the container**: increase memory available to Docker (>= 2 GB) and check `docker stats`.

## License

MIT
