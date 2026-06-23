import logging

logger = logging.getLogger("text-simplifier")

class TextSimplifier:
    @staticmethod
    def condense_long_paragraph(text, max_sentences=2):
        logger.info("Executing text-summarization compiler on long paragraph block.")
        if not text: return ""

        sentences = [s.strip() for s in text.split('.') if s.strip()]
        if len(sentences) <= max_sentences:
            return text

        # Select first leading context sentence blocks
        condensed_sentences = sentences[:max_sentences]
        summary = ". ".join(condensed_sentences) + "."
        
        logger.info(f"Paragraph condensed. Original: {len(sentences)} sentences, Summary: {len(condensed_sentences)}")
        return summary