import logging
from pptx.util import Pt
from theme_engine.color_translator import ColorTranslator

logger = logging.getLogger("caption-generator")

class CaptionGenerator:
    @staticmethod
    def draw_context_caption_box(slide, image_shape, caption_text):
        logger.info(f"Generating image figure label caption box underneath shape: {caption_text}")
        shapes = slide.shapes
        
        # Calculate coordinate offsets relative to host image shape
        left_pos = image_shape.left
        top_pos = image_shape.top + image_shape.height + Pt(6)
        width_pos = image_shape.width
        height_pos = Pt(20)

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