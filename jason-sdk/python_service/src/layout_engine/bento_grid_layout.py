import logging
from ..core_canvas.coordinate_transformer import CoordinateTransformer

logger = logging.getLogger("bento-grid-layout")

class BentoGridLayout:
    @staticmethod
    def calculate_bento_grid_cells(canvas_width_emu, canvas_height_emu, margin_left_emu, margin_top_emu, columns=3, rows=2):
        logger.info(f"Compiling Bento Box layout matrix. Grid geometry defined: {columns}x{rows}")
        
        usable_width = canvas_width_emu - (margin_left_emu * 2)
        usable_height = canvas_height_emu - (margin_top_emu * 1.6)
        
        gap_emu = CoordinateTransformer.inches_to_emu(0.2)
        
        cell_width = int((usable_width - (gap_emu * (columns - 1))) / columns)
        cell_height = int((usable_height - (gap_emu * (rows - 1))) / rows)
        
        grid_matrix = []
        
        for r in range(rows):
            for c in range(columns):
                cell_left = margin_left_emu + c * (cell_width + gap_emu)
                cell_top = margin_top_emu + r * (cell_height + gap_emu)
                
                coordinates = {
                    "row_index": r,
                    "col_index": c,
                    "left": cell_left,
                    "top": cell_top,
                    "width": cell_width,
                    "height": cell_height
                }
                grid_matrix.append(coordinates)
                
        logger.info(f"Bento Box layout matrices configured. total segments created: {len(grid_matrix)}")
        return grid_matrix