import logging
from core_canvas.coordinate_transformer import CoordinateTransformer

logger = logging.getLogger("split-screen-layout")

class SplitScreenLayout:
    @staticmethod
    def calculate_split_positions(canvas_width_emu, canvas_height_emu, margin_left_emu, margin_top_emu, split_ratio=0.5):
        logger.info(f"Calculating split-screen layout coordinate boundaries. Ratio split: {split_ratio * 100}%")
        
        # Calculate functional canvas sizes minus boundary margins
        usable_width = canvas_width_emu - (margin_left_emu * 2)
        usable_height = canvas_height_emu - (margin_top_emu * 1.5)
        
        spacing_emu = CoordinateTransformer.inches_to_emu(0.4) # Gap between split blocks
        
        # Split width sizing allocations
        left_block_width = int((usable_width - spacing_emu) * split_ratio)
        right_block_width = int((usable_width - spacing_emu) * (1.0 - split_ratio))
        
        left_coordinates = {
            "left": margin_left_emu,
            "top": margin_top_emu,
            "width": left_block_width,
            "height": usable_height
        }
        
        right_coordinates = {
            "left": margin_left_emu + left_block_width + spacing_emu,
            "top": margin_top_emu,
            "width": right_block_width,
            "height": usable_height
        }
        
        logger.info(f"Left block: {left_coordinates['width']} EMUs, Right block: {right_coordinates['width']} EMUs")
        return left_coordinates, right_coordinates