using ScriptPortal.Vegas;
using System;

public class EntryPoint
{
    public void FromVegas(Vegas vegas)
    {
        Timecode maxGap = Timecode.FromFrames(2); // adjust threshold here

        foreach (Track track in vegas.Project.Tracks)
        {
            if (!(track is VideoTrack)) continue;
            VideoTrack videoTrack = (VideoTrack)track;

            for (int i = 0; i < videoTrack.Events.Count - 1; i++)
            {
                TrackEvent current = videoTrack.Events[i];
                TrackEvent next = videoTrack.Events[i + 1];

                Timecode gap = next.Start - current.End;

                if (gap > Timecode.FromFrames(0) && gap <= maxGap)
                {
                    // Extend current event to bridge the gap
                    current.Length += gap;
                }
            }
        }
    }
}
