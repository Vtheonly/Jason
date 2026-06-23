import logging
from .flowchart_blocks import FlowchartBlocks
from .uml_class_sequence import UmlClassSequence
from .entity_relationship import EntityRelationship
from .dependency_network_maps import DependencyNetworkMaps
from .pipeline_visualizers import PipelineVisualizers

logger = logging.getLogger("diagram-orchestrator")

class DiagramOrchestrator:
    def __init__(self, slide):
        self.slide = slide

    def draw_diagram(self, diagram_type, nodes_data, edges_data, left_emu, top_emu, width_emu, height_emu):
        logger.info(f"Orchestrating vector diagram generation. Type: {diagram_type}")
        
        if diagram_type == "flowchart":
            FlowchartBlocks.draw_flowchart(self.slide, left_emu, top_emu, width_emu, height_emu, nodes_data, edges_data)
        elif diagram_type == "uml_class":
            UmlClassSequence.draw_class_blocks(self.slide, left_emu, top_emu, width_emu, height_emu, nodes_data)
        elif diagram_type == "sequence":
            UmlClassSequence.draw_sequence_diagram(self.slide, left_emu, top_emu, width_emu, height_emu, nodes_data, edges_data)
        elif diagram_type == "network":
            DependencyNetworkMaps.draw_layered_network(self.slide, left_emu, top_emu, width_emu, height_emu, nodes_data, edges_data)
        else:
            logger.warn(f"Unidentified diagram type parameter requested. Drawing flowchart fallback: {diagram_type}")
            FlowchartBlocks.draw_flowchart(self.slide, left_emu, top_emu, width_emu, height_emu, nodes_data, edges_data)