import logging
from pptx.util import Inches

logger = logging.getLogger("video-media-embedder")

class VideoMediaEmbedder:
    @staticmethod
    def embed_native_mp4_video(slide, left_emu, top_emu, width_emu, height_emu, video_file_path, poster_frame_path=None):
        logger.info(f"Embedding video into slide layout: {video_file_path}")
        try:
            shapes = slide.shapes
            # PPTX natively embeds videos as a multimedia shape object
            video_shape = shapes.add_movie(
                video_file_path,
                left_emu,
                top_emu,
                width_emu,
                height_emu,
                poster_frame_image_path=poster_frame_path
            )
            
            # Configure visual playback setting variables
            # Under the hood, python-pptx maps these onto play-on-click or auto-trigger relationships XML
            logger.info("Video media element embedded successfully.")
            return video_shape
        except Exception as err:
            logger.error(f"Video media element embedding failed: {str(err)}")
            raise err