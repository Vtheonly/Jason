import logging
from pptx.util import Pt

logger = logging.getLogger("font-pairer")

class FontPairer:
    @staticmethod
    def apply_text_styling(run, font_name, font_size_pt, is_bold=False, is_italic=False, color_rgb=None):
        logger.info(f"Applying text runs typography styling. Target: {font_name}, Size: {font_size_pt}Pt")
        
        # Configure run typography properties
        run.font.name = font_name
        run.font.size = Pt(font_size_pt)
        run.font.bold = is_bold
        run.font.italic = is_italic
        
        if color_rgb:
            run.font.color.rgb = color_rgb
            
        return run