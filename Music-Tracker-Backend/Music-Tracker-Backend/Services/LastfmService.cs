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
                var artist = spotifyTrack.Artist;
                var track = spotifyTrack.Title;

                var url = $"{BaseUrl}?method=track.getInfo" +
                          $"&api_key={_lastFmApiKey}" +
                          $"&artist={Uri.EscapeDataString(artist)}" +
                          $"&track={Uri.EscapeDataString(track)}" +
                          "&format=json";

                Console.WriteLine($"Lastfm Url: {url}");

                var response = await _httpClient.GetStringAsync(url);

                Console.WriteLine($"Response: {response}");

                var jsonDocument = JsonDocument.Parse(response);

                if (!jsonDocument.RootElement.TryGetProperty("track", out JsonElement trackElement))
                {
                    Console.WriteLine("No track data found.");
                    return null;
                }

                var lastfmTrack = new LastfmTrack
                {
                    Mbid = trackElement.TryGetProperty("mbid", out var mbidProp) ? mbidProp.GetString() : null,
                    Title = trackElement.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null,
                    Artist = trackElement.TryGetProperty("artist", out var artistElement)
                        ? new Artist
                        {
                            Mbid = artistElement.TryGetProperty("mbid", out var artistMbidProp) ? artistMbidProp.GetString() : null,
                            Name = artistElement.TryGetProperty("name", out var artistNameProp) ? artistNameProp.GetString() : null
                        }
                        : null,
                    Album = trackElement.TryGetProperty("album", out var albumElement)
                        ? new Album
                        {
                            Mbid = albumElement.TryGetProperty("mbid", out var albumMbidProp) ? albumMbidProp.GetString() : null,
                            Title = albumElement.TryGetProperty("title", out var albumTitleProp) ? albumTitleProp.GetString() : null,
                            CoverImages = albumElement.TryGetProperty("image", out var imagesElement)
                                ? imagesElement.EnumerateArray()
                                    .Select(img => new CoverImage
                                    {
                                        Url = img.TryGetProperty("#text", out var urlProp) ? urlProp.GetString() : null,
                                        Size = img.TryGetProperty("size", out var sizeProp) ? sizeProp.GetString() : null
                                    })
                                    .Where(c => !string.IsNullOrEmpty(c.Url)) // Only take valid images
                                    .ToList()
                                : new List<CoverImage>()
                        }
                        : null,
                    Genres = trackElement.TryGetProperty("toptags", out var toptagsElement)
                        && toptagsElement.TryGetProperty("tag", out var tagsArrayElement)
                        ? tagsArrayElement.EnumerateArray()
                            .Select(tag => tag.TryGetProperty("name", out var tagNameProp) ? tagNameProp.GetString() : null)
                            .Where(name => !string.IsNullOrEmpty(name))
                            .ToList()
                        : new List<string>()
                };

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
