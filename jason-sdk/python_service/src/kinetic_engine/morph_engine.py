import os
import logging
from xml.etree import ElementTree

logger = logging.getLogger("morph-engine")

def apply_native_morph_pre_processing(extract_path, transition_manifest):
    logger.info("Active native Morph XML transitions configuration injection helper.")
    
    slides_dir = os.path.join(extract_path, "ppt/slides")
    if not os.path.exists(slides_dir):
        logger.warning(f"Slides path target not found for post processing: {slides_dir}")
        return

    mappings = transition_manifest.get("mappings", [])
    if not mappings:
        logger.info("No transitions metadata declared. Processing fallback transitions.")
        return

    # XML Namespaces dictionaries
    namespaces = {
        'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'
    }
    for prefix, uri in namespaces.items():
        ElementTree.register_namespace(prefix, uri)

    slide_files = sorted([f for f in os.listdir(slides_dir) if f.endswith(".xml")])

    for slide_file in slide_files:
        slide_xml_path = os.path.join(slides_dir, slide_file)
        logger.info(f"Modifying transition settings inside slide XML document: {slide_file}")
        
        tree = ElementTree.parse(slide_xml_path)
        root = tree.getroot()

        # Update matching visual shape descriptors to trigger morph identities (!!jason_morph_...)
        cNvPr_nodes = root.findall(".//p:cNvPr", namespaces)
        for node in cNvPr_nodes:
            name_val = node.get("name", "")
            descr_val = node.get("descr", "")

            for map_entry in mappings:
                keyword = map_entry.get("keyword")
                morph_id = map_entry.get("morph_id")
                
                if keyword in name_val or keyword in descr_val:
                    morph_tag = f"!!jason_morph_{morph_id}"
                    node.set("name", morph_tag)
                    # Preserve original descr (alt-text) for accessibility —
                    # append the morph tag rather than overwriting the description
                    node.set("descr", f"{descr_val} {morph_tag}" if descr_val else morph_tag)
                    logger.info(f"Bound XML morphological tracking identifier matching keyword: {keyword}")

        tree.write(slide_xml_path, encoding='UTF-8', xml_declaration=True)