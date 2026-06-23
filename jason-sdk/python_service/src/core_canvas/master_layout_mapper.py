import logging

logger = logging.getLogger("master-layout-mapper")

class MasterLayoutMapper:
    @staticmethod
    def map_placeholder_indexes(slide):
        logger.info("Scanning structural Slide Master for layout placeholders.")
        placeholder_map = {}
        
        # Walk slide layouts placeholder elements
        for ph in slide.placeholders:
            ph_idx = ph.placeholder_format.idx
            ph_type = ph.placeholder_format.type
            
            logger.info(f"Discovered placeholder. Format Index: {ph_idx}, Type Name: {ph_type}")
            placeholder_map[ph_type] = ph_idx
            
        return placeholder_map

    @staticmethod
    def populate_placeholder_text(slide, placeholder_type, text_content):
        logger.info(f"Populating Master placeholder cell: {placeholder_type} with parsed text runs.")
        try:
            for ph in slide.placeholders:
                if ph.placeholder_format.type == placeholder_type:
                    ph.text = text_content
                    return True
            logger.warn(f"No active slide master placeholder matches type: {placeholder_type}")
            return False
        except Exception as err:
            logger.error(f"Placeholder population failed: {str(err)}")
            return False