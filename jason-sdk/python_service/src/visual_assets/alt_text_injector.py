import logging

logger = logging.getLogger("alt-text-injector")

class AltTextInjector:
    @staticmethod
    def write_accessibility_tags(shape, title, description):
        logger.info(f"Injecting accessibility attributes onto shape. Title: {title}")
        try:
            # PowerPoint nonvisual properties node hierarchy (cNvPr) is used to store Alt-Text
            cNvPr_element = shape._element.nvSpPr.cNvPr
            
            # Inject structural description and title tag parameters
            cNvPr_element.set('title', str(title))
            cNvPr_element.set('descr', str(description))
            
            logger.info("Accessibility alt-text successfully updated.")
            return True
        except Exception as err:
            logger.error(f"Failed to inject alt-text XML attributes: {str(err)}")
            return False