import logging

logger = logging.getLogger("dynamic-spacer")

class DynamicSpacer:
    @staticmethod
    def balance_element_vertical_spacing(total_height_emu, items_count, container_top_emu, container_height_emu):
        """Calculate balanced vertical positions for items within a container.
        
        Args:
            total_height_emu: Sum of all item heights in EMU
            items_count: Number of items to position
            container_top_emu: Top edge of the container in EMU
            container_height_emu: Total height of the container in EMU
        
        Returns:
            List of absolute top positions (in EMU) for each item, evenly
            distributed within the container. For a single item, it is
            centered vertically.
        """
        logger.info("Performing item layout coordinate alignment calculations.")
        
        if items_count <= 0:
            return []
            
        # Check for single elements and center vertically
        if items_count == 1:
            centered_top = container_top_emu + int((container_height_emu - total_height_emu) / 2)
            return [centered_top]
            
        remaining_space = container_height_emu - total_height_emu
        if remaining_space < 0:
            logger.warning("Vertical space collision. Content exceeds bounding coordinates. Forcing tight packing.")
            remaining_space = 0
            
        gap = int(remaining_space / (items_count + 1))  # +1 for padding at top and bottom
        
        # Return absolute top positions for each item, not just gaps.
        # Position each item with equal spacing between items and container edges.
        positions = []
        current_top = container_top_emu + gap
        for i in range(items_count):
            positions.append(current_top)
            # Note: callers must add the actual item height to get the next position.
            # Since we don't have per-item heights here, we distribute evenly.
            # For equal-height items, each item gets (total_height_emu / items_count) height.
            if items_count > 0:
                item_height_estimate = total_height_emu // items_count
                current_top += item_height_estimate + gap
            
        return positions
