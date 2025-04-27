
namespace Music_Tracker_Backend.Models
{
    public class SpotifyTrack
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Artist { get; set; }
        public string AlbumName { get; set; }
        public int Duration { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    }
}
