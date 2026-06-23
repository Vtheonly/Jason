import os
import zipfile
import logging

logger = logging.getLogger("asset-bundler")

class AssetBundler:
    @staticmethod
    def package_assets_to_zip(pptx_path, pdf_path, outline_txt_path, output_zip_path):
        logger.info(f"Packaging processed deliverables into target zip folder output: {output_zip_path}")
        
        try:
            with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                # Add compiled PPTX presentation file
                if pptx_path and os.path.exists(pptx_path):
                    zip_file.write(pptx_path, os.path.basename(pptx_path))
                    
                # Add print-ready PDF conversion deliverable
                if pdf_path and os.path.exists(pdf_path):
                    zip_file.write(pdf_path, os.path.basename(pdf_path))
                    
                # Add extracted outline text summary files
                if outline_txt_path and os.path.exists(outline_txt_path):
                    zip_file.write(outline_txt_path, os.path.basename(outline_txt_path))
                    
            logger.info("Assets deliverable bundle compressed successfully.")
            return output_zip_path
        except Exception as err:
            logger.error("Asset zip bundler package compression failed.", exc_info=True)
            raise err