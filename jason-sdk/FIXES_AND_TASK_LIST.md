# Jason SDK — Complete Fix List & Implementation Guide

This document provides a comprehensive, step-by-step task list of every issue identified in the Jason SDK codebase, the fix that was applied, and detailed instructions on how each fix works.

---

## P0 — CRITICAL FIXES (Runtime Failures / Data Corruption / Security)

### Fix 1: `glassmorphism_effects.py` — `line.width` Assigned Wrong Type (RGBColor instead of Pt)

**File:** `python_service/src/theme_engine/glassmorphism_effects.py`  
**Line:** 45  
**Severity:** 🔴 CRITICAL — Runtime TypeError when glassmorphism effect is used

**Problem:**  
```python
card_shape.line.width = ColorTranslator.hex_to_rgb("#FFFFFF")
```
`ColorTranslator.hex_to_rgb()` returns an `RGBColor` object, but `line.width` expects an integer EMU value or a `Pt()` value. This causes a runtime `TypeError`.

**Fix Applied:**
```python
from pptx.util import Pt  # Added import
card_shape.line.width = Pt(0.75)  # Ultra-thin glass border (0.75pt)
```

**How to verify:** Run any slide generation that uses glassmorphism effects. It should no longer throw a TypeError.

---

### Fix 2: `verify_and_fix_structure.sh` — Wrong File Extension Creates Phantom `.js` File

**File:** `verify_and_fix_structure.sh`  
**Line:** 103  
**Severity:** 🔴 CRITICAL — Creates wrong file type in Python directory

**Problem:**  
```bash
for f in __init__.py auto_selector.js split_screen_layout.py ...
```
`auto_selector.js` should be `auto_selector.py`. Running this script would create a useless JavaScript file in the Python layout_engine directory.

**Fix Applied:** Changed `auto_selector.js` to `auto_selector.py`.

**How to verify:** Run `bash verify_and_fix_structure.sh` and check that only `.py` files are created in `python_service/src/layout_engine/`.

---

### Fix 3: `verify_and_fix_structure.sh` — Phantom `kinetic/` Directory

**File:** `verify_and_fix_structure.sh`  
**Lines:** 158-160  
**Severity:** 🔴 CRITICAL — Creates dead directory that confuses developers

**Problem:** The script created `python_service/src/kinetic/` with its own `morph_engine.py`, but all actual imports use `kinetic_engine.morph_engine`. This creates a phantom package that is never imported.

**Fix Applied:** Removed the phantom `kinetic/` directory creation lines and added a comment explaining that `morph_engine` belongs in `kinetic_engine/`.

**How to verify:** `ls python_service/src/kinetic/` should not exist. Only `python_service/src/kinetic_engine/` should exist.

---

### Fix 4: `.dockerignore` Files in Wrong Location

**Files:** `node_service/.dockerignore`, `python_service/.dockerignore`  
**Severity:** 🔴 CRITICAL — Docker ignores these files, copying `node_modules/` and `__pycache__/` into images

**Problem:** Docker only reads `.dockerignore` from the build context root (`jason-sdk/`). The service-specific `.dockerignore` files are completely ignored, meaning `node_modules/` from local development gets copied into the Docker image, overwriting the Docker-installed modules with potentially wrong platform binaries.

**Fix Applied:** Created a unified `jason-sdk/.dockerignore` at the repo root that covers both services:
- Node.js: `node_service/node_modules`, `.npm`, coverage, test artifacts
- Python: `__pycache__`, `*.pyc`, `.venv`, `.pytest_cache`
- Common: `.git`, `.env`, `.DS_Store`, `*.md`, `docs/`, `output/`, `sample_assets/`

**How to verify:** `docker build` should no longer copy local `node_modules/` or `__pycache__/` into the image.

---

### Fix 5: `cli_router.js` — Missing Theme and Transitions Arguments for gRPC

**File:** `node_service/src/cli/cli_router.js`  
**Line:** 80  
**Severity:** 🔴 CRITICAL — CLI never sends theme/transitions to Python service

**Problem:**  
```javascript
await executeChartCompilation(extractionDir, chartPayload);
```
The web gateway correctly passes all 4 arguments, but the CLI only passes 2. This means morph transitions and theme data are never sent to the Python service when using the CLI.

**Fix Applied:**
```javascript
await executeChartCompilation(extractionDir, chartPayload, finalPayload.theme || {}, finalPayload.transitions || {});
```

**How to verify:** Run the CLI with a config that includes theme/transitions data. Check Python service logs to confirm the payloads are received.

---

### Fix 6: `brace_parser.js` — XML Tag-Splitting Regex Disaster

**File:** `node_service/src/template_engine/brace_parser.js`  
**Severity:** 🔴 CRITICAL — Broken placeholders in output PPTX

**Problem:** PowerPoint splits text across multiple `<a:r>` runs. For example, `{{title}}` might become:
```xml
<a:r><a:t>{{ti</a:t></a:r><a:r><a:t>tle}}</a:t></a:r>
```
The regex `/\{\{([^}]+)\}\}/g` only matches within a single string, so split placeholders are completely missed, resulting in broken text like `{{ti` and `tle}}` in the output.

**Fix Applied:** Implemented a two-phase approach:
1. **Fast path:** Try the existing regex first (works for non-split placeholders)
2. **DOM path:** If no matches found, use DOM parsing to:
   - Collect all `<a:r>` text runs within each `<a:p>` paragraph
   - Merge text content across runs
   - Perform placeholder replacement on the merged text
   - Write the result back into the first `<a:t>` node, clearing the rest

**How to verify:** Create a PPTX template where PowerPoint splits a placeholder across runs (common with formatted text). The placeholder should now resolve correctly.

---

### Fix 7: `loop_iterator.js` — OOXML Relational Model Breakage

**File:** `node_service/src/template_engine/loop_iterator.js`  
**Severity:** 🔴 CRITICAL — PPTX corruption: "found a problem with content" errors

**Problem:** When unrolling `{{#each}}` loops, `cloneNode(true)` clones XML elements inside `slideN.xml` but does NOT duplicate or update the corresponding relationship entries in `slideN.xml.rels`. Cloned shapes referencing images, charts, or hyperlinks have invalid `rId` references.

**Fix Applied:**
1. Added `remapRelationshipIds()` method that scans cloned nodes for `r:embed`, `r:link`, and `r:id` attributes and assigns unique new rId values
2. Added `updateSlideRels()` async method that updates the corresponding `.rels` file by adding new `Relationship` entries for each remapped rId
3. The rId counter starts at 100 to avoid collisions with existing IDs

**How to verify:** Create a template with an `{{#each}}` loop containing images or charts. The output PPTX should open without corruption errors.

---

### Fix 8: `inline_styling.js` — Destructive Markdown Parsing

**File:** `node_service/src/typography/inline_styling.js`  
**Severity:** 🟠 HIGH — XML corruption from careless string replacement

**Problem:** The `ensureXmlProperty` method uses simple regex replacement that could accidentally modify multiple `<a:rPr>` elements across different runs, or corrupt nested XML structure.

**Fix Applied:**
- Added safer regex matching that only modifies the FIRST `<a:rPr>` within the run
- Added fallback that refuses to insert if no safe insertion point is found (logs warning instead)
- Prevents cross-run corruption by being more conservative about where modifications are applied

**How to verify:** Test with runs that contain complex nested formatting. No existing formatting should be lost.

---

### Fix 9: `excel_workbook_updater.py` — XML Cache Corruption

**File:** `python_service/src/charts/excel_workbook_updater.py`  
**Severity:** 🔴 CRITICAL — Multi-series charts display wrong data

**Problem:** The `synchronize_xml_caches` method flattened ALL numeric values from the dataset into a single list and wrote them into EVERY `<c:val>` node. This means a 3-series chart would have all 3 series' data in each series cache, causing completely wrong visualizations.

**Fix Applied:**
1. Group numeric values by column (series) instead of flattening
2. Map each `<c:val>` node to its corresponding series column
3. Preserve header row in `update_sheet_cells` instead of deleting all rows
4. Added file existence check before parsing chart XML

**How to verify:** Create a multi-series chart (e.g., bar chart with 3 data series). Each series should display only its own data, not duplicated data.

---

### Fix 10: `index.js` — Silent gRPC Failures

**File:** `node_service/src/index.js`  
**Lines:** 165-170  
**Severity:** 🔴 CRITICAL — Users receive corrupted PPTX with empty charts

**Problem:**  
```javascript
} catch (grpcErr) {
    log.warn(`[${runId}] gRPC chart compilation failed: ${grpcErr.message}`);
}
```
When gRPC chart compilation fails, the code only logs a warning and still returns the compiled PPTX. The user receives a file with broken/empty chart data — silent corruption.

**Fix Applied:** Changed to throw the error, failing the entire request:
```javascript
throw new Error(`Chart compilation failed: ${grpcErr.message}. The compiled PPTX would contain invalid chart data.`);
```

**How to verify:** When the Python service is down, the API should return a 500 error instead of a PPTX with empty charts.

---

### Fix 11: `file_resolver.js` — Arbitrary File Read / Path Traversal

**File:** `node_service/src/input_system/file_resolver.js`  
**Severity:** 🔴 CRITICAL — Security vulnerability: arbitrary file read

**Problem:** The `$ref` resolver accepts absolute paths like `"$ref": "/etc/passwd"` and resolves them without validation. An attacker can read any file on the host system.

**Fix Applied:**
1. Reject all absolute paths in `$ref` values
2. Added `validatePathSandbox()` method that checks resolved paths stay within the allowed base directory
3. Uses `path.normalize()` to prevent `../../` traversal attacks

**How to verify:** Try submitting a config with `"$ref": "/etc/passwd"`. It should be rejected with a security violation error.

---

### Fix 12: `compiler.js` — Zip Bomb Vulnerability

**File:** `node_service/src/template_engine/compiler.js`  
**Severity:** 🔴 CRITICAL — Server disk/memory exhaustion attack

**Problem:** Uses `decompress` to extract uploaded PPTX files with no size limits. A zip bomb containing gigabytes of data would consume all disk space.

**Fix Applied:**
1. Added pre-extraction file size check (max 100MB)
2. Added decompression filter that skips entries larger than 500MB
3. Added `ppt/slides` directory existence check with clear error message

**How to verify:** Upload a file larger than 100MB. It should be rejected with a clear error message.

---

### Fix 13: `server.py` — No Graceful Shutdown

**File:** `python_service/server.py`  
**Severity:** 🟠 HIGH — Files left in inconsistent state on container stop

**Problem:** The gRPC server calls `server.wait_for_termination()` with no signal handlers. When Docker sends SIGTERM, the process is forcefully killed, potentially leaving files in an inconsistent state.

**Fix Applied:**
1. Added `_handle_shutdown()` signal handler for SIGTERM and SIGINT
2. Grace period of 5 seconds for in-flight RPCs to complete
3. Added `grpc.max_receive_message_length` and `grpc.max_send_message_length` options (50MB)
4. Added per-chart error tracking with `ErrorDetail` proto messages
5. Added extraction path validation

**How to verify:** Run `docker stop jason-python-core`. The server should log "Initiating graceful shutdown" and exit cleanly.

---

## P1 — HIGH PRIORITY FIXES

### Fix 14: `markdown_parser.js` — Duplicate Regex Pattern

**File:** `node_service/src/typography/markdown_parser.js`  
**Line:** 11  
**Severity:** 🟠 HIGH — Single-underscore italics not parsed

**Problem:**  
```javascript
const combinedTokens = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`|__.*?__|__.*?__)/g;
```
The `__.*?__` pattern appears TWICE. The second should be `_.*?_` for single-underscore italics.

**Fix Applied:**
```javascript
const combinedTokens = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`|__.*?__|_.*?_)/g;
```
Also added handling for single-underscore italic tokens.

**How to verify:** Test `_italic text_` in markdown content. It should render as italic.

---

### Fix 15: `index.js` — Unused Imports

**File:** `node_service/src/index.js`  
**Lines:** 15-16  
**Severity:** 🟠 HIGH — Unnecessary bundle size, confusing codebase

**Problem:** `MissingAssetChecker` and `DebugPreview` are imported but never used.

**Fix Applied:** Removed both unused imports.

---

### Fix 16: `compiler.js` — Missing Directory Existence Check

**File:** `node_service/src/template_engine/compiler.js`  
**Lines:** 30-31  
**Severity:** 🟠 HIGH — Unhandled ENOENT error on corrupt templates

**Problem:** If the PPTX template is corrupt or doesn't contain `ppt/slides/`, `fs.readdir()` throws an unhandled `ENOENT` error.

**Fix Applied:** Added `fs.pathExists()` check with clear error message.

---

### Fix 17: `protobuf_loader.js` — No Error Handling for Proto Loading

**File:** `node_service/src/grpc/protobuf_loader.js`  
**Lines:** 21-40  
**Severity:** 🟠 HIGH — Entire Node app crashes if proto file is missing

**Problem:** `loadSync` is called at module import time with no try-catch. If the proto file is missing or malformed, the entire Node application crashes.

**Fix Applied:**
1. Wrapped proto loading in try-catch
2. Added validation that the `ChartCompilation` service was loaded
3. Created a Proxy-based stub client as fallback that throws meaningful errors on use
4. The web gateway still starts and serves health checks even when gRPC is unavailable

**How to verify:** Delete the proto file and start the Node service. It should start and serve `/health`, but gRPC calls should fail with a clear error.

---

### Fix 18: `docker-compose.yml` — Python Service Missing Healthcheck

**File:** `docker-compose.yml`  
**Severity:** 🟠 HIGH — Node service starts before Python is ready, causing transient failures

**Problem:** Only `jason-web` had a healthcheck. Docker Compose's `depends_on` only waits for container start, not readiness.

**Fix Applied:**
1. Added Python service healthcheck using a gRPC readiness check script
2. Created `/app/healthcheck.py` in the Python Docker image
3. Changed `depends_on` to use `condition: service_healthy` so Node waits for Python to be ready

**How to verify:** Run `docker-compose up`. Node service should wait until Python's gRPC server is confirmed ready.

---

### Fix 19: Double Morph Processing

**Files:** `node_service/src/index.js`, `python_service/server.py`  
**Severity:** 🟠 HIGH — Wasteful redundant processing

**Problem:** The Node kineticEngine applies morph tags BEFORE the gRPC call. The Python service then tries to apply morph tags AGAIN, which is a no-op since keywords are already replaced with `!!jason_morph_<id>` tags.

**Fix Applied:** Commented out the redundant morph processing in `server.py` with an explanation of why it's skipped.

---

### Fix 20: `caption_generator.py` — Math Unit Mismatch

**File:** `python_service/src/automation_intel/caption_generator.py`  
**Severity:** 🟠 HIGH — Unpredictable layout positioning

**Problem:** Mixed `Pt(6)` with raw EMU values from `image_shape.top/height`. The `Pt()` helper returns an `int` (EMU value), but the code didn't make the unit conversion explicit, leading to confusion.

**Fix Applied:**
```python
from pptx.util import Pt, Emu
caption_gap_emu = Emu(int(Pt(6)))   # Explicitly wrap in Emu()
caption_height_emu = Emu(int(Pt(20)))
```

---

### Fix 21: Workspace Pollution — Non-Unique IDs, Incomplete Cleanup

**File:** `node_service/src/index.js`  
**Severity:** 🟠 HIGH — Path collisions, orphaned files filling `/tmp`

**Problem:**
- Run IDs used `Date.now() + Math.random()` — not cryptographically unique
- `finally` block only cleaned up `extracted/` and `uploads/` but not `output/`
- Crashed processes left orphaned directories

**Fix Applied:**
1. Changed to `crypto.randomUUID()` for collision-free run IDs
2. Changed `finally` cleanup to remove the entire `runWorkspace` directory
3. Added Multer file size limits (100MB per file, 2 files max)

---

## P2 — MEDIUM PRIORITY FIXES

### Fix 22: `requirements.txt` — Unused numpy Dependency

**File:** `python_service/requirements.txt`  
**Severity:** 🟡 MEDIUM — Unnecessary Docker image bloat

**Problem:** `numpy==1.26.4` was listed but never imported or used anywhere.

**Fix Applied:** Removed `numpy` from requirements.

---

### Fix 23: `slides_builder/__init__.py` — Missing Class Exports

**File:** `python_service/src/slides_builder/__init__.py`  
**Severity:** 🟡 MEDIUM — Inconsistent with other packages

**Problem:** Only contained a docstring with no imports or exports, inconsistent with all other `__init__.py` files.

**Fix Applied:** Added explicit imports and `__all__` exports for all builder classes.

---

### Fix 24: `presentation_schema.json` — Missing `additionalProperties: false`

**File:** `shared_schemas/presentation_schema.json`  
**Severity:** 🟡 MEDIUM — Typos in config silently accepted

**Problem:** The `slide_model` definition lacked `additionalProperties: false`, meaning typos like `"tittle"` instead of `"title"` were silently accepted. Same for diagram node and edge items.

**Fix Applied:** Added `additionalProperties: false` to:
- `slide_model` definition
- Diagram node items
- Diagram edge items

---

### Fix 25: `compilation.proto` — ErrorDetail Never Populated

**File:** `python_service/server.py` (consumer of `compilation.proto`)  
**Severity:** 🟡 MEDIUM — Dead protocol surface, no error details

**Problem:** The `errors` field in `CompilationResponse` was defined in the proto but never populated by the Python server.

**Fix Applied:** The Python server now populates `ErrorDetail` messages for:
- Morph processing failures
- Per-chart compilation failures
- Pipeline-level failures
- Invalid extraction path

---

### Fix 26: `index.js` — No CORS Configuration

**File:** `node_service/src/index.js`  
**Severity:** 🟡 MEDIUM — Browser blocks cross-origin API calls

**Problem:** The Express app had no CORS headers configured.

**Fix Applied:** Added manual CORS middleware (no extra dependency needed):
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
```

---

### Fix 27: `index.js` — No Request Body Size Limit

**File:** `node_service/src/index.js`  
**Severity:** 🟡 MEDIUM — DoS vector for JSON body endpoints

**Problem:** No `express.json()` body size limit was configured.

**Fix Applied:** Added `express.json({ limit: '10mb' })` and Multer limits.

---

## P3 — LOW PRIORITY FIXES

### Fix 28: `kineticEngine.js` / `morph_engine.py` — Morph Tag Destroys Alt-Text

**Files:** `node_service/src/core/kineticEngine.js`, `python_service/src/kinetic_engine/morph_engine.py`  
**Severity:** 🔵 LOW — Accessibility concern

**Problem:** Both files set `descr` to the morph tag, destroying the original alt-text description.

**Fix Applied:** Changed to append the morph tag to the existing description:
```javascript
node.setAttribute('descr', descrVal ? `${descrVal} ${morphTag}` : morphTag);
```

---

### Fix 29: `dynamic_spacer.py` — Returns Gaps Instead of Positions

**File:** `python_service/src/layout_engine/dynamic_spacer.py`  
**Severity:** 🔵 LOW — Inconsistent API; callers must manually sum gaps

**Problem:** The method claimed to calculate positions but returned a list of identical gap values instead of absolute positions.

**Fix Applied:** Now returns absolute top positions for each item, with proper vertical distribution including padding at top and bottom.

---

### Fix 30: `pdf_converter.py` / `slide_rasterizer.py` — Swallowed Subprocess stderr

**Files:** `python_service/src/export_pipeline/pdf_converter.py`, `python_service/src/kinetic_engine/slide_rasterizer.py`  
**Severity:** 🔵 LOW — Difficult to debug LibreOffice failures

**Problem:** Both used `stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL`, making it impossible to diagnose LibreOffice failures.

**Fix Applied:** Changed to `capture_output=True, text=True, timeout=120` and log stderr output.

---

### Fix 31: `server.py` — No Per-Request Timeout

**File:** `python_service/server.py`  
**Severity:** 🔵 LOW — Single slow request could block a worker indefinitely

**Fix Applied:** Added gRPC message size limits (50MB) as a practical boundary. Full per-request timeout requires additional gRPC interceptor infrastructure.

---

## Docker / Containerization Improvements

### Fix 32: Python Dockerfile — Added Healthcheck Script

**File:** `python_service/Dockerfile`

Added `/app/healthcheck.py` that uses gRPC channel ready future to verify the server is responding. This is used by both the Dockerfile HEALTHCHECK and docker-compose healthcheck.

### Fix 33: Node Dockerfile — Added HEALTHCHECK Directive

**File:** `node_service/Dockerfile`

Added a proper `HEALTHCHECK` directive using `wget` to hit the `/health` endpoint.

### Fix 34: docker-compose.yml — `service_healthy` Condition

Changed `depends_on` from simple start dependency to `condition: service_healthy`, ensuring the Node service waits for the Python gRPC server to be fully ready before accepting requests.

---

## Summary

| Category | Count |
|----------|-------|
| 🔴 P0 Critical | 13 |
| 🟠 P1 High | 8 |
| 🟡 P2 Medium | 6 |
| 🔵 P3 Low | 4 |
| 🐳 Docker | 3 |
| **Total Fixes** | **34** |

All fixes have been applied to the codebase. To verify the fixes:

1. **Build Docker images:** `cd jason-sdk && docker-compose build`
2. **Start services:** `docker-compose up`
3. **Test health:** `curl http://localhost:3000/health`
4. **Test API:** Upload a template + config to `POST /api/generate`
5. **Test CLI:** `node src/cli/cli_router.js --template demo.pptx --config demo.json --output out.pptx`
