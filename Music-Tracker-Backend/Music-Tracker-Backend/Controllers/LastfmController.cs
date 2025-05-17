using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Music_Tracker_Backend.Services;
using System.Security.Claims;

namespace Music_Tracker_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LastfmController : ControllerBase
    {
        private readonly ILastfmService _lastfmService;
        private readonly ISpotifyService _spotifyService;
        public LastfmController(ILastfmService lastfmService, ISpotifyService spotifyService = null)
        {
            _lastfmService = lastfmService;
            _spotifyService = spotifyService;
        }

        // ────────────────────────────────────────────────────────────────
        // 7 - Get similar tracks (lastfm)
        // ────────────────────────────────────────────────────────────────
        [Authorize]
        [HttpGet("get-similar")]
        public async Task<IActionResult> GetSimilarTracks([FromQuery] string? mbid, string? artist, string? track, int limit = 10)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found in token.");

            var lastfmTracks = await _lastfmService.GetSimilarTracksAsync(mbid: mbid, trackName: track, artistName: artist, limit: limit);

            var tasks = lastfmTracks.Select(async lastfmTrack =>
            {
                var spotifyTrack = await _spotifyService.SearchSpotifyForTrack(lastfmTrack.Artist?.Name, lastfmTrack.Title, userId);
                if (spotifyTrack?.Id != null)
                {
                    lastfmTrack.SpotifyId = spotifyTrack.Id;
                    return lastfmTrack;
                }
                else
                {
                    return null; // Mark for exclusion
                }
            });

            var enrichedTracks = await Task.WhenAll(tasks);

            // Filter out nulls
            return Ok(enrichedTracks.Where(t => t != null));
        }

    }
}
