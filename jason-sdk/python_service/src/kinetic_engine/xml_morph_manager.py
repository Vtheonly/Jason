"""XML morph manager.

Lightweight helper around the raw XML manipulation performed by the
kinetic engine. Kept as a separate module so callers that only need the
morph tag injection logic can import it without pulling in the heavier
rasterizer / video synthesizer dependencies (LibreOffice, FFmpeg).
"""
import logging
from xml.etree import ElementTree

logger = logging.getLogger("xml-morph-manager")

# PowerPoint / DrawingML namespaces used by the morph pre-processor.
_NAMESPACES = {
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
}

for _prefix, _uri in _NAMESPACES.items():
    ElementTree.register_namespace(_prefix, _uri)


class XmlMorphManager:
    """Tag matching shapes with the `!!jason_morph_<id>` tracker tag.

    PowerPoint's native Morph transition animates shapes whose name (or
    alt-text) starts with `!!` and is identical across two consecutive
    slides. This class scans a slide XML tree for shapes whose name or
    descr field contains a configured keyword and rewrites those
    attributes so the Morph engine picks them up.
    """

    @staticmethod
    def tag_matching_shapes(slide_xml_path, mappings):
        """Rewrite shape name/descr attributes in place.

        Args:
            slide_xml_path: Absolute path to a ppt/slides/slideN.xml file.
            mappings: List of dicts with `keyword` and `morph_id` keys.

        Returns:
            True if the file was modified, False otherwise.
        """
        if not mappings:
            return False

        try:
            tree = ElementTree.parse(slide_xml_path)
        except (ElementTree.ParseError, FileNotFoundError) as err:
            logger.error(f"Unable to parse slide XML for morph tagging: {slide_xml_path} ({err})")
            return False

        root = tree.getroot()
        modified = False

        for node in root.findall(".//p:cNvPr", _NAMESPACES):
            name_val = node.get("name", "") or ""
            descr_val = node.get("descr", "") or ""

            for map_entry in mappings:
                keyword = map_entry.get("keyword")
                morph_id = map_entry.get("morph_id")
                if not keyword or not morph_id:
                    continue

                if keyword in name_val or keyword in descr_val:
                    morph_tag = f"!!jason_morph_{morph_id}"
                    node.set("name", morph_tag)
                    node.set("descr", morph_tag)
                    modified = True
                    logger.info(f"Tagged shape with morph id: {morph_id} (keyword: {keyword})")

        if modified:
            tree.write(slide_xml_path, encoding='UTF-8', xml_declaration=True)

        return modified
