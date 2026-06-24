import os
import subprocess
import glob
import logging

logger = logging.getLogger("pdf-converter")

class PdfConverter:
    @staticmethod
    def convert_pptx_to_pdf(pptx_file_path, output_directory_path):
        logger.info(f"Initiating PPTX-to-PDF compilation via headless LibreOffice converter process. File: {pptx_file_path}")
        
        if not os.path.exists(pptx_file_path):
            raise FileNotFoundError(f"Source file not found: {pptx_file_path}")

        # Headless LibreOffice conversion command
        cmd = [
            "libreoffice", "--headless", "--convert-to", "pdf",
            "--outdir", output_directory_path, pptx_file_path
        ]

        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=120)
            if result.stderr:
                logger.info(f"LibreOffice stderr output: {result.stderr[:500]}")
            logger.info("LibreOffice PDF conversion completed successfully.")
            
            # Retrieve PDF path from working folder
            pdf_files = glob.glob(os.path.join(output_directory_path, "*.pdf"))
            if pdf_files:
                return pdf_files[0]
            else:
                raise FileNotFoundError("Intermediate PDF container was not generated.")
        except subprocess.SubprocessError as err:
            logger.error("Headless LibreOffice subprocess conversion failed.", exc_info=True)
            raise err