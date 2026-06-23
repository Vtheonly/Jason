import os
import logging
import openpyxl
from xml.etree import ElementTree

logger = logging.getLogger("excel-workbook-updater")

class ExcelWorkbookUpdater:
    def __init__(self, extract_path):
        self.extract_path = extract_path

    def update_sheet_cells(self, chart_idx, dataset):
        embedding_file = os.path.join(
            self.extract_path, 
            f"ppt/embeddings/Microsoft_Excel_Worksheet{chart_idx + 1}.xlsx"
        )
        
        if not os.path.exists(embedding_file):
            raise FileNotFoundError(f"Underlying workbook missing: {embedding_file}")

        logger.info(f"Updating embedded spreadsheet worksheet: {embedding_file}")
        wb = openpyxl.load_workbook(embedding_file)
        sheet = wb.active

        # Clear existing data rows
        sheet.delete_rows(1, sheet.max_row + 1)

        # Append fresh data rows
        for r_idx, row_values in enumerate(dataset, start=1):
            for c_idx, val in enumerate(row_values, start=1):
                sheet.cell(row=r_idx, column=c_idx, value=val)

        wb.save(embedding_file)
        logger.info("Embedded spreadsheet updated successfully.")

    def synchronize_xml_caches(self, xml_path, dataset):
        namespaces = {'c': 'http://schemas.openxmlformats.org/drawingml/2006/chart'}
        ElementTree.register_namespace('c', namespaces['c'])
        tree = ElementTree.parse(xml_path)
        root = tree.getroot()

        # Update category caches (<c:cat>)
        cat_nodes = root.findall('.//c:cat', namespaces)
        categories = [str(r[0]) for r in dataset[1:]] # First column contains categories
        for node in cat_nodes:
            str_cache = node.find('.//c:strCache', namespaces)
            if str_cache is not None:
                self._rebuild_string_cache(str_cache, categories)

        # Update numeric value caches (<c:val>)
        val_nodes = root.findall('.//c:val', namespaces)
        numeric_values = []
        for r in dataset[1:]:
            for val in r[1:]:
                try:
                    numeric_values.append(float(val))
                except (ValueError, TypeError):
                    pass

        for node in val_nodes:
            num_cache = node.find('.//c:numCache', namespaces)
            if num_cache is not None:
                self._rebuild_numeric_cache(num_cache, numeric_values)

        tree.write(xml_path, encoding='UTF-8', xml_declaration=True)

    def _rebuild_string_cache(self, str_cache, categories):
        for child in list(str_cache):
            str_cache.remove(child)
        pt_count = ElementTree.SubElement(str_cache, '{http://schemas.openxmlformats.org/drawingml/2006/chart}ptCount')
        pt_count.set('val', str(len(categories)))
        for idx, cat in enumerate(categories):
            pt = ElementTree.SubElement(str_cache, '{http://schemas.openxmlformats.org/drawingml/2006/chart}pt')
            pt.set('idx', str(idx))
            v = ElementTree.SubElement(pt, '{http://schemas.openxmlformats.org/drawingml/2006/chart}v')
            v.text = cat

    def _rebuild_numeric_cache(self, num_cache, values):
        for child in list(num_cache):
            num_cache.remove(child)
        pt_count = ElementTree.SubElement(num_cache, '{http://schemas.openxmlformats.org/drawingml/2006/chart}ptCount')
        pt_count.set('val', str(len(values)))
        for idx, val in enumerate(values):
            pt = ElementTree.SubElement(num_cache, '{http://schemas.openxmlformats.org/drawingml/2006/chart}pt')
            pt.set('idx', str(idx))
            v = ElementTree.SubElement(pt, '{http://schemas.openxmlformats.org/drawingml/2006/chart}v')
            v.text = str(val)