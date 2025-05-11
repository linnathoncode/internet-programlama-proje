namespace Music_Tracker_Backend.Models
{
    public class ListeningHistoryEntry
    {
        public string TrackId { get; set; }
        public long Timestamp { get; set; }
        public DateTime PlayedAt { get; set; }
    }
}
