import os
import subprocess
import logging

logger = logging.getLogger("video-synthesizer")

class VideoSynthesizer:
    @staticmethod
    def compile_slide_transition_video(frame_images_list, slide_duration_sec, transition_duration_sec, output_mp4_path):
        logger.info(f"Synthesizing kinetic slide transition video. Total frames: {len(frame_images_list)}")
        
        if len(frame_images_list) < 2:
            raise ValueError("Video synthesis compilation requires at least 2 distinct slide frames.")

        input_args = []
        filter_complex = ""
        
        # Build loop parameters inputs
        for idx, img in enumerate(frame_images_list):
            input_args.extend(["-loop", "1", "-t", str(slide_duration_sec), "-i", img])

        # Formulate FFmpeg xfade horizontal sliding transitions filter graph complex
        last_out = "0"
        offset = slide_duration_sec - transition_duration_sec
        
        for idx in range(1, len(frame_images_list)):
            next_out = f"v_out_{idx}"
            filter_complex += (
                f"[{last_out}][{idx}]xfade=transition=slideleft"
                f":duration={transition_duration_sec}:offset={offset}[{next_out}]; "
            )
            last_out = next_out
            offset += (slide_duration_sec - transition_duration_sec)

        # Clear trailing whitespace and separators from filter string
        filter_complex = filter_complex.rstrip("; ")

        # Compile final command line structure
        cmd = [
            "ffmpeg", "-y"
        ]
        cmd.extend(input_args)
        cmd.extend([
            "-filter_complex", filter_complex,
            "-map", f"[{last_out}]",
            "-pix_fmt", "yuv420p",
            "-c:v", "libx264",
            "-preset", "medium",
            "-r", "60", # Force uncompressed 60FPS output fluid transitions
            output_mp4_path
        ])

        try:
            logger.info("Calling FFmpeg video compiler process.")
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info(f"Kinetic presentation video generated at output destination: {output_mp4_path}")
        except subprocess.SubprocessError as err:
            logger.error("FFmpeg runtime video stitching failed.", exc_info=True)
            raise err