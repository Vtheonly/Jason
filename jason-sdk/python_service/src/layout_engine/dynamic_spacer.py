import logging

logger = logging.getLogger("dynamic-spacer")

class DynamicSpacer:
    @staticmethod
    def balance_element_vertical_spacing(total_height_emu, items_count, container_top_emu, container_height_emu):
        logger.info("Performing item layout coordinate alignment calculations.")
        
        if items_count <= 0:
            return []
            
        # Check for single elements and center vertically
        if items_count == 1:
            centered_top = container_top_emu + int((container_height_emu - total_height_emu) / 2)
            return [centered_top]
            
        remaining_space = container_height_emu - total_height_emu
        if remaining_space < 0:
            logger.warn("Vertical space collision. Content exceeds bounding coordinates. Forcing tight packing.")
            remaining_space = 0
            
        gap = int(remaining_space / (items_count - 1))
        
        gaps_list = []
        for i in range(items_count):
            gaps_list.append(gap)
            
        return gaps_list