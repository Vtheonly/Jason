import logging
from pptx.dml.color import RGBColor

logger = logging.getLogger("color-translator")

class ColorTranslator:
    @staticmethod
    def hex_to_rgb(hex_string):
        if not hex_string:
            return RGBColor(0, 0, 0)
        
        # Strip '#' prefix if present
        clean_hex = hex_string.replace("#", "")
        
        if len(clean_hex) != 6:
            logger.warning(f"Malformed hexadecimal format targeting translation: {hex_string}. Falling back to black.")
            return RGBColor(0, 0, 0)
            
        try:
            r = int(clean_hex[0:2], 16)
            g = int(clean_hex[2:4], 16)
            b = int(clean_hex[4:6], 16)
            return RGBColor(r, g, b)
        except ValueError:
            logger.error(f"Conversion error translating color value: {hex_string}. Return default black.")
            return RGBColor(0, 0, 0)