namespace Music_Tracker_Backend.Models
{
    public class SpotifySearchResult
    {
        public Tracks Tracks { get; set; }
    }

    public class Tracks
    {
        public List<SpotifyTrack> Items { get; set; }
    }

}
