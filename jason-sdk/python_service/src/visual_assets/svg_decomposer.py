import logging
from xml.etree import ElementTree
from pptx.enum.shapes import MSO_SHAPE

logger = logging.getLogger("svg-decomposer")

class SvgDecomposer:
    @staticmethod
    def extract_vector_elements(svg_file_path):
        logger.info(f"Extracting XML vectors from SVG file: {svg_file_path}")
        elements_list = []
        try:
            # Parse SVG namespaces cleanly
            tree = ElementTree.parse(svg_file_path)
            root = tree.getroot()
            
            # Simplified path extraction (mapping SVG elements onto canvas coordinate models)
            for path in root.findall(".//{http://www.w3.org/2000/svg}path"):
                d_attr = path.get("d", "")
                fill = path.get("fill", "#000000")
                logger.info(f"Found vector path node. Fill color: {fill}")
                elements_list.append({
                    "type": "path",
                    "data": d_attr,
                    "fill": fill
                })
            return elements_list
        except Exception as err:
            logger.error(f"SVG decomposition failed: {str(err)}")
            return []