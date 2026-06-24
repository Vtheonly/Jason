import logging
from pptx.util import Pt, Emu
from theme_engine.color_translator import ColorTranslator

logger = logging.getLogger("caption-generator")

class CaptionGenerator:
    @staticmethod
    def draw_context_caption_box(slide, image_shape, caption_text):
        logger.info(f"Generating image figure label caption box underneath shape: {caption_text}")
        shapes = slide.shapes
        
        # Calculate coordinate offsets relative to host image shape.
        # All units are in EMU (English Metric Units) to maintain consistency.
        # image_shape.top, image_shape.height, image_shape.left, image_shape.width
        # are already in EMU from python-pptx.
        # We use Emu() to wrap literal EMU values for clarity and type safety,
        # and Pt() only for font sizes (which python-pptx converts to EMU internally).
        caption_gap_emu = Emu(int(Pt(6)))   # 6pt gap between image and caption
        caption_height_emu = Emu(int(Pt(20))) # 20pt tall caption box
        
        left_pos = image_shape.left
        top_pos = image_shape.top + image_shape.height + caption_gap_emu
        width_pos = image_shape.width
        height_pos = caption_height_emu

        # Draw transparent label box shape
        caption_box = shapes.add_textbox(left_pos, top_pos, width_pos, height_pos)
        tf = caption_box.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = f"Figure: {caption_text}"
        p.alignment = 1 # Horizontal centering
        
        for run in p.runs:
            run.font.name = "Arial"
            run.font.size = Pt(8.5)
            run.font.italic = True
            run.font.color.rgb = ColorTranslator.hex_to_rgb("#757575")
            
        logger.info("Image contextual caption label rendering completed.")
        return caption_box
