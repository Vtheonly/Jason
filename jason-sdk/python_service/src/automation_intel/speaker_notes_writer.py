import logging

logger = logging.getLogger("speaker-notes-writer")

class SpeakerNotesWriter:
    @staticmethod
    def generate_defense_talking_notes(slide_title, layout_type, key_bullets_list):
        logger.info(f"Compiling presentation-ready talking guide note details for slide: {slide_title}")
        
        notes_prompt = []
        notes_prompt.append(f"JURY SPEAKER OUTLINE - SLIDE: {slide_title.upper()}")
        notes_prompt.append(f"Layout blueprint strategy applied: {layout_type}")
        notes_prompt.append("\nDefense Outline talking points:")
        
        # Generate defense roadmap bullet points
        for idx, bullet in enumerate(key_bullets_list, start=1):
            notes_prompt.append(f"  {idx}. Discuss and emphasize point: {bullet}")
            
        notes_prompt.append("\nPresenter Cues: maintain steady pacing, keep clear eye contact, and pause to highlight key charts.")
        
        joined_notes = "\n".join(notes_prompt)
        logger.info("Talking guide notes outline compiled successfully.")
        return joined_notes