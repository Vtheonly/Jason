import os
import glob
import subprocess
import logging

logger = logging.getLogger("slide-rasterizer")

class SlideRasterizer:
    def __init__(self, pptx_file_path, working_directory_path):
        self.pptx_path = pptx_file_path
        self.working_dir = working_directory_path
        self.extracted_frames_dir = os.path.join(working_directory_path, "rasterized_slides")
        os.makedirs(self.extracted_frames_dir, exist_ok=True)

    def generate_uncompressed_png_frames(self):
        logger.info("Converting presentation vector formats to uncompressed high-fidelity PDF.")
        
        # Step A: Convert PPTX to PDF via headless LibreOffice subprocess calls
        cmd_pdf = [
            "libreoffice", "--headless", "--convert-to", "pdf",
            "--outdir", self.working_dir, self.pptx_path
        ]
        
        try:
            result = subprocess.run(cmd_pdf, check=True, capture_output=True, text=True, timeout=120)
            if result.stderr:
                logger.info(f"LibreOffice stderr output: {result.stderr[:500]}")
        except subprocess.SubprocessError as err:
            logger.error("LibreOffice process call conversion crashed.", exc_info=True)
            raise err

        pdf_files = glob.glob(os.path.join(self.working_dir, "*.pdf"))
        if not pdf_files:
            raise FileNotFoundError("Intermediate PDF container was not generated.")
            
        pdf_file = pdf_files[0]
        logger.info(f"Targeting PDF intermediate: {pdf_file}")

        # Step B: Render PDF pages as PNG frames via pdftoppm vector tool
        cmd_images = [
            "pdftoppm", "-png", "-r", "150", # 150 DPI yields high-fidelity 1080p frames cleanly
            pdf_file, os.path.join(self.extracted_frames_dir, "slide")
        ]
        
        try:
            subprocess.run(cmd_images, check=True)
            logger.info(f"Successfully rasterized slide frames inside workspace: {self.extracted_frames_dir}")
        finally:
            # Safely evict temporary PDF
            if os.path.exists(pdf_file):
                os.remove(pdf_file)

        # Retrieve structured outputs list
        frame_images = sorted(glob.glob(os.path.join(self.extracted_frames_dir, "slide-*.png")))
        return frame_images