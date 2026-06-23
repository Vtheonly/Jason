import os
import logging
from PIL import Image

logger = logging.getLogger("resolution-checker")

class ResolutionChecker:
    @staticmethod
    def verify_raster_image_resolution(img_file_path, min_dpi_threshold=100):
        logger.info(f"Auditing pixel resolution settings for image: {img_file_path}")
        
        if not os.path.exists(img_file_path):
            return False
            
        try:
            with Image.open(img_file_path) as img:
                # Retrieve DPI information (standard default format: (x_dpi, y_dpi))
                dpi_info = img.info.get("dpi", (72, 72))
                
                x_dpi = dpi_info[0]
                logger.info(f"Mapped image resolution coordinates: {x_dpi} DPI")
                
                if x_dpi < min_dpi_threshold:
                    logger.warn(f"Image asset resolution is low: {x_dpi} DPI. Large-screen presentation may look pixelated.")
                    return False
                    
                return True
        except Exception as err:
            logger.error(f"Image resolution check failed: {str(err)}")
            return False