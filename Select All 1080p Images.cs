using ScriptPortal.Vegas;
using System;

public class EntryPoint
{
    public void FromVegas(Vegas vegas)
    {
        foreach (Track track in vegas.Project.Tracks)
        {
            if (!(track is VideoTrack)) continue;
            VideoTrack videoTrack = (VideoTrack)track;

            foreach (TrackEvent ev in videoTrack.Events)
            {
                if (!(ev is VideoEvent)) continue;
                VideoEvent videoEvent = (VideoEvent)ev;

                Take take = videoEvent.ActiveTake;
                if (take == null) continue;

                Media media = take.Media;
                if (media == null || media.Streams.Count == 0) continue;

				string filePath = media.FilePath;
				if (!string.IsNullOrEmpty(filePath))
				{
					string ext = System.IO.Path.GetExtension(filePath).ToLower();
					if (!(ext == ".jpg" || ext == ".jpeg" || ext == ".png" ||
						  ext == ".bmp" || ext == ".gif" || ext == ".tif" ||
						  ext == ".tiff" || ext == ".webp")) continue;
				}
				else
				{
					// Skip media with no file path (likely generated or video)
					continue;
				}

                MediaStream stream = media.Streams[0];
                if (!(stream is VideoStream)) continue;

                VideoStream videoStream = (VideoStream)stream;
                int width = videoStream.Width;
                int height = videoStream.Height;

                // Only check landscape images
                if (width != 1920 || height != 1080) continue;

                VideoMotion motion = videoEvent.VideoMotion;
                if (motion == null || motion.Keyframes.Count == 0) continue;

                bool isUncropped = true;
                foreach (VideoMotionKeyframe keyframe in motion.Keyframes)
                {
                    var bounds = keyframe.Bounds;
                    float boundsWidth = bounds.BottomRight.X - bounds.TopLeft.X;
                    float boundsHeight = bounds.BottomRight.Y - bounds.TopLeft.Y;

                    float boundsAspect = boundsWidth / boundsHeight;
                    float mediaAspect = 1920f / 1080f;

                    // If bounds aspect ratio differs significantly, it's cropped
                    if (Math.Abs(boundsAspect - mediaAspect) > 0.01f)
                    {
                        isUncropped = false;
                        break;
                    }
                }

                if (isUncropped)
                {
                    videoEvent.Selected = true;
                }
            }
        }
    }
}
