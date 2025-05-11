namespace Music_Tracker_Backend.Models
{
    public class TrackWithTimestampDto
    {
        public LastfmTrack Track { get; set; }
        public long Timestamp { get; set; }
    }
}
