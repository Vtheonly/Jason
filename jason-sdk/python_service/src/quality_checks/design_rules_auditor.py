import logging

logger = logging.getLogger("design-rules-auditor")

class DesignRulesAuditor:
    @staticmethod
    def audit_alignments_consistency(slide):
        logger.info("Running slide margin grids safety audits.")
        shapes = list(slide.shapes)
        if len(shapes) <= 1:
            return True

        left_alignments = []
        for shape in shapes:
            try:
                left_alignments.append(shape.left)
            except AttributeError:
                pass # Skip check for non-geometric structures

        if not left_alignments:
            return True

        # Check for grid alignment offsets consistency (such as left-edge alignments matches)
        unique_lefts_count = len(set(left_alignments))
        if unique_lefts_count > 4:
            logger.warn(f"High spatial alignment offset count: {unique_lefts_count} unique left coordinates found on slide. Design may look unstructured.")
            return False

        logger.info("Slide margin grid safety checker resolved cleanly.")
        return True