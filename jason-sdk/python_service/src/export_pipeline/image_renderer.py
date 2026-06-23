import os
import subprocess
import glob
import logging

logger = logging.getLogger("image-renderer")

class ImageRenderer:
    @staticmethod
    def render_pdf_to_high_res_images(pdf_file_path, output_images_directory_path):
        logger.info(f"Rasterizing PDF pages to uncompressed high-fidelity PNG frames. Source: {pdf_file_path}")
        os.makedirs(output_images_directory_path, exist_ok=True)

        cmd = [
            "pdftoppm", "-png", "-r", "150", # 150 DPI yields high-fidelity 1080p frames
            pdf_file_path, os.path.join(output_images_directory_path, "slide")
        ]

        try:
            subprocess.run(cmd, check=True)
            rendered_images = sorted(glob.glob(os.path.join(output_images_directory_path, "slide-*.png")))
            logger.info(f"Successfully generated {len(rendered_images)} slide images in directory: {output_images_directory_path}")
            return rendered_images
        except subprocess.SubprocessError as err:
            logger.error("pdftoppm PDF-to-Image rasterizer process crashed.", exc_info=True)
            raise err