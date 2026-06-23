import logging
from ..core_canvas.coordinate_transformer import CoordinateTransformer

logger = logging.getLogger("comparison-layout")

class ComparisonLayout:
    @staticmethod
    def calculate_comparison_columns(canvas_width_emu, canvas_height_emu, margin_left_emu, margin_top_emu):
        logger.info("Compiling 2-column comparative visual alignments coordinate allocations.")
        
        usable_width = canvas_width_emu - (margin_left_emu * 2)
        usable_height = canvas_height_emu - (margin_top_emu * 1.5)
        
        mid_spacing_emu = CoordinateTransformer.inches_to_emu(0.6) # Solid gap separating comparison entities
        
        column_width = int((usable_width - mid_spacing_emu) / 2)
        
        col1_coords = {
            "left": margin_left_emu,
            "top": margin_top_emu,
            "width": column_width,
            "height": usable_height
        }
        
        col2_coords = {
            "left": margin_left_emu + column_width + mid_spacing_emu,
            "top": margin_top_emu,
            "width": column_width,
            "height": usable_height
        }
        
        logger.info(f"Comparative columns sized: {col1_coords['width']} EMUs width per column.")
        return col1_coords, col2_coords