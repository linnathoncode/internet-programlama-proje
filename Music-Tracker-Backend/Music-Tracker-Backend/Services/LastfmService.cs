using Music_Tracker_Backend.Models;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Music_Tracker_Backend.Models;
using static Google.Api.FieldInfo.Types;
using Microsoft.Extensions.Logging;
using Google.Protobuf.WellKnownTypes;

namespace Music_Tracker_Backend.Services
{
    public class LastfmService : ILastfmService
    {
        private readonly HttpClient _httpClient;
        private readonly string _lastfmApiKey; // Store your Last.fm API key here
                                               //private readonly string _lastFmApiUrl = "https://ws.audioscrobbler.com/2.0/";
        private const string BaseUrl = "https://ws.audioscrobbler.com/2.0/";


        public LastfmService(HttpClient httpClient, string lastfmApiKey)
        {
            _httpClient = httpClient;
            _lastfmApiKey = lastfmApiKey;

        }

        // Function to get Lastfm track info by Spotify track
        public async Task<LastfmTrack> GetLastfmTrackAsync(SpotifyTrack spotifyTrack)
        {
            try
            {
                var artist = spotifyTrack.Artist;
                var track = spotifyTrack.Title;

                var url = $"{BaseUrl}?method=track.getInfo" +
                          $"&api_key={_lastfmApiKey}" +
                          $"&artist={Uri.EscapeDataString(artist)}" +
                          $"&track={Uri.EscapeDataString(track)}" +
                          "&format=json";

                //Console.WriteLine($"Lastfm Url: {url}");

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
                return new();
            }
        }

        public async Task<List<LastfmTrack>> GetSimilarTracksAsync(string? mbid, string? trackName, string? artistName, int limit)
        {

            try
            {
                var queryParams = !string.IsNullOrEmpty(mbid) ? $"&mbid={Uri.EscapeDataString(mbid)}&limit={limit}" : $"&artist={Uri.EscapeDataString(artistName)}&track={Uri.EscapeDataString(trackName)}&limit={limit}";
                var url = $"{BaseUrl}?method=track.getsimilar" +
                          $"&api_key={_lastfmApiKey}" + 
                          queryParams + 
                          "&format=json";
                Console.WriteLine(url);

                HttpResponseMessage response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Status:{response.StatusCode} Request:{response.RequestMessage}");
                    return null;
                }
                string json = await response.Content.ReadAsStringAsync();
                using JsonDocument doc = JsonDocument.Parse(json);
                List<LastfmTrack> similarTracks = new List<LastfmTrack>();

                //debug
                int i = 0;

                foreach(var trackElement in doc.RootElement.GetProperty("similartracks").GetProperty("track").EnumerateArray())
                {
                    
                    LastfmTrack track = new LastfmTrack();

                    track.Mbid = trackElement.TryGetProperty("mbid", out var mbidProp) ? mbidProp.GetString() : null;
                    track.Title = trackElement.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                    track.Duration = trackElement.TryGetProperty("duration", out var durationProp) && durationProp.TryGetInt32(out var duration) ? duration : 0;
                    track.Artist = trackElement.TryGetProperty("artist", out var artistElement)
                        ? new Artist
                        {
                            Mbid = artistElement.TryGetProperty("mbid", out var artistMbidProp) ? artistMbidProp.GetString() : null,
                            Name = artistElement.TryGetProperty("name", out var artistNameProp) ? artistNameProp.GetString() : null
                        }
                        : null;
                    track.Album = new Album  // Not present in the response, but initializing with image as a fallback
                    {
                        CoverImages = trackElement.TryGetProperty("image", out var imagesElement)
                            ? imagesElement.EnumerateArray()
                                .Select(img => new CoverImage
                                {
                                    Url = img.TryGetProperty("#text", out var urlProp) ? urlProp.GetString() : null,
                                    Size = img.TryGetProperty("size", out var sizeProp) ? sizeProp.GetString() : null
                                })
                                .Where(img => !string.IsNullOrEmpty(img.Url))
                                .ToList()
                            : new List<CoverImage>()
                    };
                    track.Genres = trackElement.TryGetProperty("toptags", out var toptagsElement)
                        && toptagsElement.TryGetProperty("tag", out var tagsArrayElement)
                        ? tagsArrayElement.EnumerateArray()
                            .Select(tag => tag.TryGetProperty("name", out var tagNameProp) ? tagNameProp.GetString() : null)
                            .Where(name => !string.IsNullOrEmpty(name))
                            .ToList()
                        : new List<string>();
                    Console.WriteLine($"Similar Track Number {i}: {track.Mbid}");
                    i++;
                    similarTracks.Add(track);
                }

                return similarTracks;

            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving similar tracks from Last.fm: {ex.Message}");
                return new();
            }
        }

    }
}

public interface ILastfmService
{
    Task<LastfmTrack> GetLastfmTrackAsync(SpotifyTrack spotifyTrack);
    Task<List<LastfmTrack>> GetSimilarTracksAsync(string? mbid, string? trackName, string? artistName, int limit);

}
