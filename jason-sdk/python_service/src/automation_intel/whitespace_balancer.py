import logging
from ..core_canvas.coordinate_transformer import CoordinateTransformer

logger = logging.getLogger("whitespace-balancer")

class WhitespaceBalancer:
    @staticmethod
    def adjust_slide_elements_whitespace(slide, canvas_height_emu):
        logger.info("Running dynamic slide whitespace layout balance algorithms.")
        shapes = list(slide.shapes)
        if len(shapes) <= 1:
            return

        # Simple vertical coordinates alignment calculation
        shapes_sorted_by_y = sorted(shapes, key=lambda s: s.top)
        
        total_shapes_height = sum([s.height for s in shapes_sorted_by_y])
        available_space = canvas_height_emu - total_shapes_height
        
        if available_space < 0:
            logger.warn("Vertical overlap detected. Shapes content height exceeds presentation dimensions.")
            return

        # Calculate balanced gap metrics between elements
        gap = int(available_space / (len(shapes_sorted_by_y) + 1))
        logger.info(f"Applying balanced vertical spacers gap: {gap} EMUs")

        current_top = gap
        for shape in shapes_sorted_by_y:
            try:
                shape.top = current_top
                current_top += shape.height + gap
            except AttributeError:
                pass # Skip layout adjustment for non-repositionable objects