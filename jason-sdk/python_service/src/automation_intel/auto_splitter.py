import logging

logger = logging.getLogger("auto-splitter")

class AutoSplitter:
    @staticmethod
    def split_slide_content_runs(bullets_list, max_bullets_per_slide=6):
        logger.info(f"Auditing list size parameters. Elements: {len(bullets_list)}")
        if len(bullets_list) <= max_bullets_per_slide:
            return [bullets_list]

        # Partition list slices across sequential frames arrays
        slides_batches = []
        for idx in range(0, len(bullets_list), max_bullets_per_slide):
            batch = bullets_list[idx : idx + max_bullets_per_slide]
            slides_batches.append(batch)

        logger.info(f"Divided bullet lists items across {len(slides_batches)} distinct slide frames.")
        return slides_batches