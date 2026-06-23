import os
import logging

logger = logging.getLogger("icon-pack-manager")

class IconPackManager:
    def __init__(self, icons_directory):
        self.icons_dir = icons_directory
        self.icon_cache = {}

    def resolve_icon_path(self, icon_keyword):
        logger.info(f"Resolving icon mapping for keyword: {icon_keyword}")
        if icon_keyword in self.icon_cache:
            return self.icon_cache[icon_keyword]

        # Locate SVG or PNG formats inside assets library folder
        candidate_names = [f"{icon_keyword}.svg", f"{icon_keyword}.png"]
        for name in candidate_names:
            target_path = os.path.join(self.icons_dir, name) if self.icons_dir else name
            if os.path.exists(target_path):
                logger.info(f"Successfully mapped icon: {target_path}")
                self.icon_cache[icon_keyword] = target_path
                return target_path

        logger.warn(f"Unable to locate icon matching identifier: {icon_keyword}")
        return None