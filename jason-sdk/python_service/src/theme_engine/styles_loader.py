import logging
from pptx.dml.color import RGBColor
from theme_engine.color_translator import ColorTranslator

logger = logging.getLogger("styles-loader")

class StylesLoader:
    def __init__(self, raw_theme_dict):
        self.raw_theme = raw_theme_dict or {}
        self.primary_color = None
        self.secondary_color = None
        self.accent_color = None
        self.font_heading = "Arial"
        self.font_body = "Calibri"
        self.mode = "light"
        
        self._load_style_tokens()

    def _load_style_tokens(self):
        logger.info("De-serializing style tokens configuration parameters.")
        
        # Extract and convert colors to RGB representations
        hex_primary = self.raw_theme.get("primary_color", "#003366")
        self.primary_color = ColorTranslator.hex_to_rgb(hex_primary)

        hex_secondary = self.raw_theme.get("secondary_color", "#4682B4")
        self.secondary_color = ColorTranslator.hex_to_rgb(hex_secondary)

        hex_accent = self.raw_theme.get("accent_color", "#FFBF00")
        self.accent_color = ColorTranslator.hex_to_rgb(hex_accent)

        # Set fallback font bounds
        self.font_heading = self.raw_theme.get("font_heading", "Arial")
        self.font_body = self.raw_theme.get("font_body", "Calibri")
        self.mode = self.raw_theme.get("mode", "light")

        logger.info(f"Applied themes: HeadingFont={self.font_heading}, BodyFont={self.font_body}, Mode={self.mode}")