using System.Text.Json.Serialization;

namespace Music_Tracker_Backend.Models
{
    public class PlaylistInfo
    {
        [JsonPropertyName("track_ids")]
        public List<string> TrackIds { get; set; }

        [JsonPropertyName("name")]
        public string PlaylistName { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("is_public")]
        public bool IsPublic { get; set; }
    }
}
