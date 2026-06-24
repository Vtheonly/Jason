import os
import logging
from charts.excel_workbook_updater import ExcelWorkbookUpdater
from charts.standard_plots import StandardPlots
from charts.financial_charts import FinancialCharts
from charts.academic_analytics import AcademicAnalytics

logger = logging.getLogger("chart-orchestrator")

class ChartOrchestrator:
    def __init__(self, extraction_path):
        self.extraction_path = extraction_path

    def compile_slide_charts(self, slide_idx, chart_idx, dataset):
        logger.info(f"Resolving chart configurations. Slide: {slide_idx}, Index: {chart_idx}")
        
        # Synchronize binary datasets across Excel sheets caches
        updater = ExcelWorkbookUpdater(self.extraction_path)
        updater.update_sheet_cells(chart_idx, dataset)

        # Synchronize the corresponding Chart XML definitions
        chart_xml_file = os.path.join(self.extraction_path, f"ppt/charts/chart{chart_idx + 1}.xml")
        if os.path.exists(chart_xml_file):
            logger.info(f"Synchronizing XML values caches: {chart_xml_file}")
            updater.synchronize_xml_caches(chart_xml_file, dataset)
        else:
            logger.warning(f"Target chart XML file not found during compile step: {chart_xml_file}")