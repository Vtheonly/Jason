import logging
from core_canvas.coordinate_transformer import CoordinateTransformer

logger = logging.getLogger("dynamic-sizing-tokens")

class DynamicSizingTokens:
    def __init__(self, ratio="16_9"):
        self.ratio = ratio
        self.screen_width_emu = 0
        self.screen_height_emu = 0
        
        self.margin_left_emu = 0
        self.margin_top_emu = 0
        self.card_padding_emu = 0
        self.border_thickness_pt = 1.5
        
        self._calculate_tokens()

    def _calculate_tokens(self):
        logger.info(f"Compiling dynamic grid tokens. Ratio set to: {self.ratio}")
        
        if self.ratio == "16_9":
            self.screen_width_emu = CoordinateTransformer.inches_to_emu(13.333)
            self.screen_height_emu = CoordinateTransformer.inches_to_emu(7.5)
            self.margin_left_emu = CoordinateTransformer.inches_to_emu(0.8)
            self.margin_top_emu = CoordinateTransformer.inches_to_emu(1.2)
        else:
            self.screen_width_emu = CoordinateTransformer.inches_to_emu(10.0)
            self.screen_height_emu = CoordinateTransformer.inches_to_emu(7.5)
            self.margin_left_emu = CoordinateTransformer.inches_to_emu(0.6)
            self.margin_top_emu = CoordinateTransformer.inches_to_emu(1.0)
            
        self.card_padding_emu = CoordinateTransformer.inches_to_emu(0.25)
        logger.info(f"Token margins calculated. Left margin: {self.margin_left_emu} EMUs")