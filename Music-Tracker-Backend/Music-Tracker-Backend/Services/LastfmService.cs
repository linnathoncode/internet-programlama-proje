using Music_Tracker_Backend.Models;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Music_Tracker_Backend.Models;
using static Google.Api.FieldInfo.Types;

namespace Music_Tracker_Backend.Services
{
    public class LastfmService : ILastfmService
    {
        private readonly HttpClient _httpClient;
        private readonly string _lastFmApiKey; // Store your Last.fm API key here
                                               //private readonly string _lastFmApiUrl = "https://ws.audioscrobbler.com/2.0/";
        private const string BaseUrl = "https://ws.audioscrobbler.com/2.0/";


        public LastfmService(HttpClient httpClient, string lastFmApiKey)
        {
            _httpClient = httpClient;
            _lastFmApiKey = lastFmApiKey;

        }

        // Function to get Lastfm track info by Spotify track
        public async Task<LastfmTrack> GetLastfmTrackAsync(SpotifyTrack spotifyTrack)
        {
            try
            {
                var artist = spotifyTrack.Artist; // Assuming SpotifyTrack has Artist field
                var track = spotifyTrack.Title;   // Assuming SpotifyTrack has Name (track title) field

                // Build the request URL for the Last.fm API
                var url = $"{BaseUrl}?method=track.getInfo" +
                          $"&api_key={_lastFmApiKey}" +
                          $"&artist={Uri.EscapeDataString(artist)}" +
                          $"&track={Uri.EscapeDataString(track)}" +
                          "&format=json";
                Console.WriteLine($"Lastfm Url: {url}");

                // Send the request to Last.fm
                var response = await _httpClient.GetStringAsync(url);

                Console.WriteLine($"Response: {response}");

                // Deserialize the response into a raw dynamic object
                var jsonDocument = JsonDocument.Parse(response);
                var trackElement = jsonDocument.RootElement.GetProperty("track");

                // Manually map the LastfmTrack object
                var lastfmTrack = new LastfmTrack
                {
                    Mbid = trackElement.GetProperty("mbid").GetString(),
                    Title = trackElement.GetProperty("name").GetString(),
                    Artist = new Artist
                    {
                        Mbid = trackElement.GetProperty("artist").GetProperty("mbid").GetString(),
                        Name = trackElement.GetProperty("artist").GetProperty("name").GetString(),
                    },
                    Album = new Album
                    {
                        Mbid = trackElement.GetProperty("album").GetProperty("mbid").GetString(),
                        Title = trackElement.GetProperty("album").GetProperty("title").GetString(),
                        // Populate CoverImages
                        CoverImages = trackElement.GetProperty("album").GetProperty("image")
                            .EnumerateArray()
                            .Select(img => new CoverImage
                            {
                                Url = img.GetProperty("#text").GetString(),
                                Size = img.GetProperty("size").GetString()  // Assume the size is available, adjust if not
                            })
                            .ToList()
                    },
                    // Populate Genres
                    Genres = trackElement.GetProperty("toptags")
                        .GetProperty("tag")
                        .EnumerateArray()
                        .Select(tag => tag.GetProperty("name").GetString())
                        .ToList()
                };

                // Set Spotify ID
                lastfmTrack.SpotifyId = spotifyTrack.Id;
                lastfmTrack.Duration = spotifyTrack.Duration;

                return lastfmTrack;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving track from Last.fm: {ex.Message}");
                return null;
            }
        }


    }
}

public interface ILastfmService
{
    Task<LastfmTrack> GetLastfmTrackAsync(SpotifyTrack spotifyTrack);

}
