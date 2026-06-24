#!/bin/bash
# Verify and fix the complete Jason SDK directory structure
# This script checks every file from the blueprint and creates any missing ones

set -e

SDK_DIR="$(cd "$(dirname "$0")" && pwd)"
CREATED_ANY=0

create_file() {
    local filepath="$1"
    if [ ! -f "$SDK_DIR/$filepath" ]; then
        mkdir -p "$(dirname "$SDK_DIR/$filepath")"
        touch "$SDK_DIR/$filepath"
        echo "CREATED: $filepath"
        CREATED_ANY=1
    fi
}

echo "=== Verifying Jason SDK structure ==="
echo ""

# Root level
for f in docker-compose.yml package.json requirements.txt README.md; do
    create_file "$f"
done

# protos/
create_file "protos/compilation.proto"
create_file "protos/kinetic.proto"

# shared_schemas/
for f in presentation_schema.json theme_schema.json transition_schema.json fyp_schema.json; do
    create_file "shared_schemas/$f"
done

# node_service/
create_file "node_service/Dockerfile"
create_file "node_service/package.json"
create_file "node_service/src/index.js"

# node_service/src/cli/
for f in cli_router.js args_parser.js; do
    create_file "node_service/src/cli/$f"
done

# node_service/src/input_system/
for f in folder_scanner.js file_resolver.js config_merger.js schema_validator.js asset_loader.js; do
    create_file "node_service/src/input_system/$f"
done

# node_service/src/template_engine/
for f in compiler.js brace_parser.js loop_iterator.js conditional_evaluator.js pipeline_filters.js; do
    create_file "node_service/src/template_engine/$f"
done

# node_service/src/typography/
for f in markdown_parser.js inline_styling.js bullet_formatter.js font_fallback_mapper.js; do
    create_file "node_service/src/typography/$f"
done

# node_service/src/interactivity/
for f in link_injector.js overview_builder.js branching_navigator.js; do
    create_file "node_service/src/interactivity/$f"
done

# node_service/src/developer_experience/
for f in plugin_manager.js hook_system.js logger.js debug_preview.js; do
    create_file "node_service/src/developer_experience/$f"
done

# node_service/src/quality_control/
for f in overcrowding_detector.js contrast_checker.js margin_auditor.js missing_asset_checker.js; do
    create_file "node_service/src/quality_control/$f"
done

# node_service/src/grpc/
for f in client_orchestrator.js protobuf_loader.js; do
    create_file "node_service/src/grpc/$f"
done

# python_service/
create_file "python_service/Dockerfile"
create_file "python_service/requirements.txt"
create_file "python_service/server.py"

# python_service/src/core_canvas/
for f in __init__.py canvas_orchestrator.py shape_generator.py coordinate_transformer.py z_order_manager.py master_layout_mapper.py; do
    create_file "python_service/src/core_canvas/$f"
done

# python_service/src/theme_engine/
for f in __init__.py styles_loader.py color_translator.py font_pairer.py gradient_provider.py glassmorphism_effects.py dynamic_sizing_tokens.py; do
    create_file "python_service/src/theme_engine/$f"
done

# python_service/src/slides_builder/
for f in __init__.py title_slide.py agenda_slide.py research_context_slides.py engineering_implementation_slides.py validation_results_slides.py closing_appendix_slides.py; do
    create_file "python_service/src/slides_builder/$f"
done

# python_service/src/layout_engine/
for f in __init__.py auto_selector.py split_screen_layout.py bento_grid_layout.py timeline_layout.py comparison_layout.py dynamic_spacer.py overflow_autofit.py; do
    create_file "python_service/src/layout_engine/$f"
done

# python_service/src/content_types/
for f in __init__.py list_formatter.py callout_warning_blocks.py quote_blocks.py tabular_adapters.py kpi_metric_cards.py check_notes_badges.py; do
    create_file "python_service/src/content_types/$f"
done

# python_service/src/visual_assets/
for f in __init__.py image_transformer.py svg_decomposer.py icon_pack_manager.py video_media_embedder.py alt_text_injector.py; do
    create_file "python_service/src/visual_assets/$f"
done

# python_service/src/charts/
for f in __init__.py chart_orchestrator.py excel_workbook_updater.py standard_plots.py financial_charts.py academic_analytics.py; do
    create_file "python_service/src/charts/$f"
done

# python_service/src/diagrams/
for f in __init__.py diagram_orchestrator.py flowchart_blocks.py uml_class_sequence.py entity_relationship.py dependency_network_maps.py pipeline_visualizers.py; do
    create_file "python_service/src/diagrams/$f"
done

# python_service/src/kinetic_engine/
for f in __init__.py xml_morph_manager.py slide_rasterizer.py video_synthesizer.py; do
    create_file "python_service/src/kinetic_engine/$f"
done

# python_service/src/automation_intel/
for f in __init__.py whitespace_balancer.py text_simplifier.py auto_splitter.py caption_generator.py speaker_notes_writer.py; do
    create_file "python_service/src/automation_intel/$f"
done

# python_service/src/quality_checks/
for f in __init__.py design_rules_auditor.py resolution_checker.py print_safety_tester.py; do
    create_file "python_service/src/quality_checks/$f"
done

# python_service/src/export_pipeline/
for f in __init__.py pdf_converter.py image_renderer.py outline_extractor.py asset_bundler.py; do
    create_file "python_service/src/export_pipeline/$f"
done

# python_service/src/fyp_templates/
for f in __init__.py computer_science_slides.py ai_research_slides.py engineering_thesis_slides.py defense_presentation_expert.py; do
    create_file "python_service/src/fyp_templates/$f"
done

# === EXTRA FILES from the detailed description ===

# node_service/src/config/
create_file "node_service/src/config/constants.js"
create_file "node_service/src/config/schema_validator.js"

# python_service/src/kinetic_engine/ morph_engine is already inside kinetic_engine/
# (The previous phantom "kinetic/" directory was a bug — removed.)

echo ""
if [ "$CREATED_ANY" -eq 1 ]; then
    echo "=== Some files were missing and have been created ==="
else
    echo "=== All files already exist! Structure is complete ==="
fi
echo ""

# Count all files
FILE_COUNT=$(find "$SDK_DIR" -type f | wc -l)
echo "Total files in jason-sdk/: $FILE_COUNT"