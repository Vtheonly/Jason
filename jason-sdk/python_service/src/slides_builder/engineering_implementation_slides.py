"""Engineering implementation slides builder."""
import logging
from pptx.util import Pt
from fyp_templates.engineering_thesis_slides import EngineeringThesisSlides
from core_canvas.coordinate_transformer import CoordinateTransformer

logger = logging.getLogger("engineering-implementation-slides")


class EngineeringImplementationSlidesBuilder:
    @staticmethod
    def build(canvas, design_constraints_list):
        logger.info("Building engineering implementation slide.")
        blank_layout = canvas.prs.slide_layouts[6]
        slide = canvas.prs.slides.add_slide(blank_layout)

        left = CoordinateTransformer.inches_to_emu(0.8)
        top = CoordinateTransformer.inches_to_emu(1.2)
        width = CoordinateTransformer.inches_to_emu(11.7)
        height = CoordinateTransformer.inches_to_emu(5.5)

        EngineeringThesisSlides.draw_constraints_matrix_block(
            slide, left, top, width, height, design_constraints_list
        )
        return slide
