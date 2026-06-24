"""Validation results slides builder."""
import logging
from pptx.util import Pt
from content_types.kpi_metric_cards import KpiMetricCards
from core_canvas.coordinate_transformer import CoordinateTransformer

logger = logging.getLogger("validation-results-slides")


class ValidationResultsSlidesBuilder:
    @staticmethod
    def build(canvas, kpi_metrics):
        """kpi_metrics: list of dicts with `value`, `label`, `subtext` keys."""
        logger.info(f"Building validation results slide with {len(kpi_metrics)} KPI cards.")
        blank_layout = canvas.prs.slide_layouts[6]
        slide = canvas.prs.slides.add_slide(blank_layout)

        if not kpi_metrics:
            return slide

        margin_left = CoordinateTransformer.inches_to_emu(0.8)
        top = CoordinateTransformer.inches_to_emu(2.0)
        total_width = CoordinateTransformer.inches_to_emu(11.7)
        gap = CoordinateTransformer.inches_to_emu(0.3)
        card_width = int((total_width - gap * (len(kpi_metrics) - 1)) / len(kpi_metrics))
        card_height = CoordinateTransformer.inches_to_emu(3.0)

        for idx, metric in enumerate(kpi_metrics):
            left = margin_left + idx * (card_width + gap)
            KpiMetricCards.draw_kpi_card(
                slide, left, top, card_width, card_height,
                metric.get("value", ""),
                metric.get("label", ""),
                metric.get("subtext")
            )
        return slide
