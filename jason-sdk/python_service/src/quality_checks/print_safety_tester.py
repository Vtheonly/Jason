import logging

logger = logging.getLogger("print-safety-tester")

class PrintSafetyTester:
    @staticmethod
    def audit_print_safety_parameters(bg_mode, font_body_hex):
        logger.info("Auditing color settings for print-friendly safety compatibility.")
        
        # Dark slide decks use excessive printer toner, making them poor for handouts
        if bg_mode == "dark":
            logger.warning("Presentation style set to dark mode. Printing dark slides uses high ink volumes. Consider light mode fallback prints.")
            return {
                "safe": False,
                "reason": "HIGH_INK_VOLUME_WARN",
                "message": "Dark mode backgrounds are not optimal for printing."
            }

        logger.info("Presentation colors successfully cleared print safety guidelines.")
        return {
            "safe": True,
            "reason": "CLEAR",
            "message": "Presentation is print-friendly."
        }