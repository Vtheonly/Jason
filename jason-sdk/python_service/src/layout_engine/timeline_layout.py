import logging
from core_canvas.coordinate_transformer import CoordinateTransformer

logger = logging.getLogger("timeline-layout")

class TimelineLayout:
    @staticmethod
    def calculate_horizontal_timeline_steps(canvas_width_emu, canvas_height_emu, margin_left_emu, margin_top_emu, steps_count=4):
        logger.info(f"Calculating timeline scale coordinate models. Steps: {steps_count}")
        
        usable_width = canvas_width_emu - (margin_left_emu * 2)
        usable_height = canvas_height_emu - (margin_top_emu * 1.5)
        
        gap_emu = CoordinateTransformer.inches_to_emu(0.3)
        
        step_width = int((usable_width - (gap_emu * (steps_count - 1))) / steps_count)
        step_height = int(usable_height * 0.7) # Save space underneath for timeline line indicators
        
        step_coordinates_list = []
        
        for idx in range(steps_count):
            left_pos = margin_left_emu + idx * (step_width + gap_emu)
            # Center the timeline vertically within the usable space
            top_pos = margin_top_emu + int((usable_height - step_height) / 2)
            
            coordinates = {
                "step_index": idx,
                "left": left_pos,
                "top": top_pos,
                "width": step_width,
                "height": step_height
            }
            step_coordinates_list.append(coordinates)
            
        logger.info("Timeline spatial allocations mapped.")
        return step_coordinates_list