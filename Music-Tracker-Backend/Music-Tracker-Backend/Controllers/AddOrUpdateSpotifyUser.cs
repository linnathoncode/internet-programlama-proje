/*
using Microsoft.AspNetCore.Mvc;
using Music_Tracker_Backend.Models;
using Music_Tracker_Backend.Services;


namespace Music_Tracker_Backend.Controllers

{
    [ApiController]
    [Route("api/[controller]")]
    public class AddOrUpdateSpotifyUser : ControllerBase
    {
        private readonly FirestoreService _firestoreService;

        public AddOrUpdateSpotifyUser(FirestoreService firestoreService)
        {
            _firestoreService = firestoreService;
        }


        // POST api/spotifyuser
        [HttpPost] 
        public async Task<IActionResult> AddOrUpdateSpotifyUserAsync([FromBody] SpotifyUser spotifyUser)
        {
            if (spotifyUser == null)
            {
                return BadRequest("SpotifyUser is null.");
            }

            var result = await _firestoreService.AddOrUpdateSpotifyUserAsync(spotifyUser);

            if (result.StartsWith("An error occurred"))
            {
                return StatusCode(500, result);  // Internal Server Error for errors during database operation
            }

            return Ok(result);  // Return success message
        }

        // GET api/spotifyuser/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSpotifyUser(string id)
        {
            var spotifyUser = await _firestoreService.GetSpotifyUserAsync(id);
            if (spotifyUser == null)
            {
                return NotFound("SpotifyUser not found.");
            }
            return Ok(spotifyUser);
        }
    }
}
*/
