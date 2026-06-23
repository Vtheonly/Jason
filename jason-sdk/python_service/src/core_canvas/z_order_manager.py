import logging

logger = logging.getLogger("z-order-manager")

class ZOrderManager:
    @staticmethod
    def send_to_back(slide, shape):
        logger.info("Reordering canvas Z-Order indices: sending shape node to back.")
        try:
            # PowerPoint shapes hierarchy is managed within slide XML structure elements
            slide_shapes_xml = slide.shapes._spTree
            shape_xml_element = shape._element
            
            # Reposition element tag at the beginning of the tree sequence
            slide_shapes_xml.remove(shape_xml_element)
            slide_shapes_xml.insert(2, shape_xml_element) # Index 0 & 1 typically represent layout master shapes
        except Exception as err:
            logger.error(f"Z-Order manipulation failed during back-send operation: {str(err)}")

    @staticmethod
    def bring_to_front(slide, shape):
        logger.info("Reordering canvas Z-Order indices: bringing shape node to front.")
        try:
            slide_shapes_xml = slide.shapes._spTree
            shape_xml_element = shape._element
            
            # Reposition element tag at the very end of the tree sequence
            slide_shapes_xml.remove(shape_xml_element)
            slide_shapes_xml.append(shape_xml_element)
        except Exception as err:
            logger.error(f"Z-Order manipulation failed during front-bring operation: {str(err)}")