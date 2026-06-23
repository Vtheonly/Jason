import logging
from pptx.util import Pt
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE
from ..theme_engine.color_translator import ColorTranslator

logger = logging.getLogger("ai-research-slides")

class AiResearchSlides:
    @staticmethod
    def draw_ai_training_loss_curves(slide, left_emu, top_emu, width_emu, height_emu, epochs_list, training_loss_list, validation_loss_list):
        logger.info(f"Generating line chart training loss curves. Epochs count: {len(epochs_list)}")
        try:
            chart_data = CategoryChartData()
            chart_data.categories = epochs_list
            chart_data.add_series("Training Loss", training_loss_list)
            chart_data.add_series("Validation Loss", validation_loss_list)

            # Create native line chart shape representing the loss curves
            chart_shape = slide.shapes.add_chart(
                XL_CHART_TYPE.LINE,
                left_emu, top_emu, width_emu, height_emu,
                chart_data
            )
            
            logger.info("AI training loss curves line chart generated.")
            return chart_shape
        except Exception as err:
            logger.error(f"Loss curves chart generation failed: {str(err)}")
            raise err