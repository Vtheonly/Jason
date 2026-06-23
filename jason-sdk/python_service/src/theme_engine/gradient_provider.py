import logging
from pptx.oxml.xmlchemy import OxmlElement

logger = logging.getLogger("gradient-provider")

class GradientProvider:
    @staticmethod
    def inject_shape_gradient(shape, color_start_rgb, color_end_rgb, angle_degrees=90):
        logger.info(f"Injecting linear XML gradient pathways onto shape. Angle: {angle_degrees}°")
        try:
            # PowerPoint solid/gradient configurations reside in shape properties (spPr) XML
            spPr = shape._element.spPr
            
            # Clear pre-existing solid fill nodes to prevent visual rendering conflicts
            for solid_node in spPr.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/main}solidFill"):
                spPr.remove(solid_node)
            for grad_node in spPr.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/main}gradFill"):
                spPr.remove(grad_node)

            # Build gradient structural XML nodes using drawingml schema namespaces
            gradFill = OxmlElement('a:gradFill')
            gradFill.set('rotWithShape', '1')

            gsLst = OxmlElement('a:gsLst')

            # GS Stop 1 (Start offset)
            gs1 = OxmlElement('a:gs')
            gs1.set('pos', '0')
            srgbClr1 = OxmlElement('a:srgbClr')
            srgbClr1.set('val', f"{color_start_rgb[0]:02X}{color_start_rgb[1]:02X}{color_start_rgb[2]:02X}")
            gs1.append(srgbClr1)
            gsLst.append(gs1)

            # GS Stop 2 (End offset)
            gs2 = OxmlElement('a:gs')
            gs2.set('pos', '100000') # 100% offset value is represented as 100,000 index
            srgbClr2 = OxmlElement('a:srgbClr')
            srgbClr2.set('val', f"{color_end_rgb[0]:02X}{color_end_rgb[1]:02X}{color_end_rgb[2]:02X}")
            gs2.append(srgbClr2)
            gsLst.append(gs2)

            gradFill.append(gsLst)

            # Configure gradient linear layout vector properties
            lin = OxmlElement('a:lin')
            lin.set('ang', str(angle_degrees * 60000)) # Angle represented as millidegrees (60,000 per degree)
            lin.set('scaled', '1')
            gradFill.append(lin)

            spPr.append(gradFill)
            logger.info("Gradient elements injected into underlying XML structure successfully.")
        except Exception as err:
            logger.error(f"OXML structural gradient inject action failed: {str(err)}")