import logging
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE
from pptx.util import Inches

logger = logging.getLogger("standard-plots")

class StandardPlots:
    @staticmethod
    def draw_native_bar_chart(slide, left_emu, top_emu, width_emu, height_emu, categories, series_name, values):
        logger.info(f"Rendering standard bar chart. Categories count: {len(categories)}")
        try:
            chart_data = CategoryChartData()
            chart_data.categories = categories
            chart_data.add_series(series_name, values)

            # Create standard column bar chart shape
            chart_shape = slide.shapes.add_chart(
                XL_CHART_TYPE.COLUMN_CLUSTERED,
                left_emu, top_emu, width_emu, height_emu,
                chart_data
            )
            
            logger.info("Bar chart generated successfully.")
            return chart_shape
        except Exception as err:
            logger.error(f"Standard plots generation failed: {str(err)}")
            raise err