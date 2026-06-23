import os
import logging
from PIL import Image
from pptx.util import Inches, Pt

logger = logging.getLogger("image-transformer")

class ImageTransformer:
    @staticmethod
    def crop_and_resize_source_image(img_file_path, target_width_pixels, target_height_pixels, output_cropped_path):
        logger.info(f"Executing PIL image processing. Source file: {img_file_path}")
        
        if not os.path.exists(img_file_path):
            raise FileNotFoundError(f"Source asset image not found: {img_file_path}")
            
        try:
            with Image.open(img_file_path) as img:
                # Calculate coordinates centered crop calculations
                orig_width, orig_height = img.size
                
                target_ratio = float(target_width_pixels) / target_height_pixels
                orig_ratio = float(orig_width) / orig_height
                
                if orig_ratio > target_ratio:
                    # Input is wider: trim horizontal dimensions left/right
                    crop_width = int(orig_height * target_ratio)
                    crop_height = orig_height
                    left = int((orig_width - crop_width) / 2)
                    top = 0
                else:
                    # Input is taller: trim vertical dimensions top/bottom
                    crop_width = orig_width
                    crop_height = int(orig_width / target_ratio)
                    left = 0
                    top = int((orig_height - crop_height) / 2)
                    
                right = left + crop_width
                bottom = top + crop_height
                
                logger.info(f"Image trimming dimensions: Box=({left}, {top}, {right}, {bottom})")
                cropped_img = img.crop((left, top, right, bottom))
                resized_img = cropped_img.resize((target_width_pixels, target_height_pixels), Image.Resampling.LANCZOS)
                
                resized_img.save(output_cropped_path)
                logger.info("Image processing pipeline executed successfully.")
                return output_cropped_path
        except Exception as err:
            logger.error(f"Image transformation failed inside PIL executor: {str(err)}")
            raise err