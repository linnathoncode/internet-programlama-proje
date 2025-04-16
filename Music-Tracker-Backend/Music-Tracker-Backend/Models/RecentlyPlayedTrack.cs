namespace Music_Tracker_Backend.Models
{
    public class RecentlyPlayedTrack
    {
        public string TrackName { get; set; }
        public string ArtistName { get; set; }
        public string AlbumName { get; set; }
        public DateTime PlayedAt { get; set; }

    }
}
