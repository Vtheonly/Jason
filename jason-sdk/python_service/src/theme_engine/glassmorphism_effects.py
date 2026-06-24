import logging
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.xmlchemy import OxmlElement
from theme_engine.color_translator import ColorTranslator

logger = logging.getLogger("glassmorphism-effects")

class GlassmorphismEffects:
    @staticmethod
    def draw_glass_panel(slide, left_emu, top_emu, width_emu, height_emu, base_fill_hex="#FFFFFF", opacity=40):
        logger.info(f"Rendering Glassmorphism layered card. Base color: {base_fill_hex}, Opacity: {opacity}%")
        
        shapes = slide.shapes
        card_shape = shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left_emu, top_emu, width_emu, height_emu
        )
        
        # Sane corner radius mapping settings
        if hasattr(card_shape, 'adjustments') and len(card_shape.adjustments) > 0:
            card_shape.adjustments[0] = 0.05
            
        try:
            spPr = card_shape._element.spPr
            
            # Remove default fills
            for solid_node in spPr.findall(".//{http://schemas.openxmlformats.org/drawingml/2006/main}solidFill"):
                spPr.remove(solid_node)

            # Build transparent solid fill node
            solidFill = OxmlElement('a:solidFill')
            srgbClr = OxmlElement('a:srgbClr')
            
            clean_hex = base_fill_hex.replace("#", "")
            srgbClr.set('val', clean_hex)
            
            # Transparency values are represented inside alpha nodes: 100,000 is fully opaque
            alpha = OxmlElement('a:alpha')
            alpha.set('val', str(int(opacity * 1000)))
            srgbClr.append(alpha)
            solidFill.append(srgbClr)
            spPr.append(solidFill)

            # Configure ultra-thin glass-border outline properties
            card_shape.line.color.rgb = ColorTranslator.hex_to_rgb("#FFFFFF")
            card_shape.line.width = ColorTranslator.hex_to_rgb("#FFFFFF") # Base mapping standard thickness
            
            # Assign shadow depth elements
            spPr_xml = card_shape._element.spPr
            effectLst = OxmlElement('a:effectLst')
            outerShdw = OxmlElement('a:outerShdw')
            outerShdw.set('blurRad', '200000') # Soft blur factor (represented in EMUs)
            outerShdw.set('dist', '30000')      # 3pt distance EMU scale conversion factor
            outerShdw.set('dir', '5400000')     # Direct bottom angle (90 degrees represented in millidegrees)
            outerShdw.set('algn', 'b')
            
            srgbClr_shdw = OxmlElement('a:srgbClr')
            srgbClr_shdw.set('val', '000000') # Standard black shadow base
            alpha_shdw = OxmlElement('a:alpha')
            alpha_shdw.set('val', '15000')    # 15% Shadow density transparency bounds
            srgbClr_shdw.append(alpha_shdw)
            outerShdw.append(srgbClr_shdw)
            effectLst.append(outerShdw)
            spPr_xml.append(effectLst)

            logger.info("Glassmorphism layered design parameters applied cleanly.")
            return card_shape
        except Exception as err:
            logger.error(f"Glassmorphism visual element render pipeline broke: {str(err)}")
            return card_shape