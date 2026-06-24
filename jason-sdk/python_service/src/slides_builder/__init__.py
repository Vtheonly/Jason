"""Slides Builder package.

High-level slide constructors that compose canvas primitives into
ready-to-use slides. Each module builds a specific slide archetype
(title, agenda, research context, engineering implementation,
validation results, closing/appendix). All builders accept a
CanvasOrchestrator instance and a slide configuration dict.
"""

from slides_builder.title_slide import TitleSlideBuilder
from slides_builder.agenda_slide import AgendaSlideBuilder
from slides_builder.research_context_slides import ResearchContextSlideBuilder
from slides_builder.engineering_implementation_slides import EngineeringImplementationSlideBuilder
from slides_builder.validation_results_slides import ValidationResultsSlideBuilder
from slides_builder.closing_appendix_slides import ClosingAppendixSlideBuilder

__all__ = [
    'TitleSlideBuilder',
    'AgendaSlideBuilder',
    'ResearchContextSlideBuilder',
    'EngineeringImplementationSlideBuilder',
    'ValidationResultsSlideBuilder',
    'ClosingAppendixSlideBuilder',
]
