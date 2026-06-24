"""Research context slides builder."""
import logging
from pptx.util import Pt
from content_types.callout_warning_blocks import CalloutWarningBlocks
from core_canvas.coordinate_transformer import CoordinateTransformer

logger = logging.getLogger("research-context-slides")


class ResearchContextSlidesBuilder:
    @staticmethod
    def build(canvas, problem_statement, related_work_bullets=None):
        logger.info("Building research context slide.")
        blank_layout = canvas.prs.slide_layouts[6]
        slide = canvas.prs.slides.add_slide(blank_layout)

        left = CoordinateTransformer.inches_to_emu(0.8)
        top = CoordinateTransformer.inches_to_emu(1.2)
        width = CoordinateTransformer.inches_to_emu(11.7)
        height = CoordinateTransformer.inches_to_emu(2.5)

        CalloutWarningBlocks.draw_notice_card(
            slide, left, top, width, height,
            problem_statement, level="info"
        )
        return slide
