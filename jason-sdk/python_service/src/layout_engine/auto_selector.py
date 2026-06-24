"""Layout auto-selector.

Picks the most appropriate layout engine for a given slide configuration
based on the declared `layout` field and the number of declared content
blocks (charts, diagrams, bullets). Falls back to a sensible default
when no explicit layout is declared.
"""
import logging

logger = logging.getLogger("layout-auto-selector")


class LayoutAutoSelector:
    LAYOUT_PRIORITY = [
        "title",
        "agenda",
        "hero",
        "split_screen",
        "bento_grid",
        "timeline",
        "comparison",
        "academic_results",
    ]

    @staticmethod
    def select_layout(slide_config):
        """Return the layout name to use for the given slide config dict."""
        declared = slide_config.get("layout")
        if declared and declared in LayoutAutoSelector.LAYOUT_PRIORITY:
            logger.info(f"Using declared layout: {declared}")
            return declared

        # Heuristic fallback: pick a layout based on content density.
        bullets = slide_config.get("bullets") or []
        charts = slide_config.get("charts") or []
        diagrams = slide_config.get("diagrams") or []

        if charts and diagrams:
            picked = "bento_grid"
        elif len(charts) >= 2:
            picked = "comparison"
        elif diagrams and not charts:
            picked = "hero"
        elif len(bullets) > 4:
            picked = "split_screen"
        else:
            picked = "title"

        logger.info(f"Auto-selected layout: {picked} (declared: {declared})")
        return picked
