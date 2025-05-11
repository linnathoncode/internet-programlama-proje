using Google.Cloud.Firestore;
using Music_Tracker_Backend.Models;
using System.Collections.Generic;

namespace Music_Tracker_Backend.Services
{
    public class FirestoreService : IDatabaseService
    {
        private readonly FirestoreDb _firestore;
        public FirestoreService(IConfiguration configuration)
        {
            var projectId = configuration["Firestore:FirestoreProjectId"];

            _firestore = FirestoreDb.Create(projectId);
        }

        // Wrapper for method AddOrUpdateSpotifyUserAsync
        public async Task<string> AddOrUpdateUserAsync(SpotifyUser spotifyUser)
        {
            return await AddOrUpdateSpotifyUserAsync(spotifyUser);
        }



        // Method to add a SpotifyUser to Firestore
        public async Task<string> AddOrUpdateSpotifyUserAsync(SpotifyUser spotifyUser)
        {
            try
            {
                var userCollection = _firestore.Collection("users");
                var userDoc = userCollection.Document(spotifyUser.Id);

                // Check wheter the user exists
                var userSnapshot = await userDoc.GetSnapshotAsync();
                if (userSnapshot.Exists)
                {
                    var existingUser = userSnapshot.ConvertTo<SpotifyUser>();
                    existingUser.SpotifyToken.AccessToken = spotifyUser.SpotifyToken.AccessToken;
                    existingUser.SpotifyToken.RefreshToken = spotifyUser.SpotifyToken.RefreshToken;

                    await userDoc.SetAsync(existingUser, SetOptions.MergeAll); // Update the specific field with MergeAll

                    return "SpotifyUser updated successfully.";
                }
                else
                {
                    // User doesn't exist, create a new user document
                    await userDoc.SetAsync(spotifyUser);

                    return "SpotifyUser added successfully.";
                }
            }
            catch(Exception ex)
            {
                Console.Error.WriteLine($"Error in AddOrUpdateSpotifyUserAsync: {ex.Message}");

                return $"An error occurred: {ex.Message}";
            }
            

        }
        // Method to get a SpotifyUser by ID

        public async Task<SpotifyUser?> GetSpotifyUserAsync(string userId)
        {
            try
            {
                var userDoc = await _firestore.Collection("users").Document(userId).GetSnapshotAsync();
                return userDoc.Exists ? userDoc.ConvertTo<SpotifyUser>() : null;
            }
            catch (Exception ex)
            {
                // Log the error
                Console.Error.WriteLine($"Error in GetSpotifyUserAsync: {ex.Message}");
                return null;
            }
        }

        // Add a track to Firestore
        public async Task AddTrackAsync(LastfmTrack track)
        {
            try
            {
                var trackRef = _firestore.Collection("tracks").Document(track.SpotifyId);
                await trackRef.SetAsync(track);
            }
            catch (Exception ex)
            {
                // Log the exception or handle it appropriately
                Console.WriteLine($"Error adding track: {ex.Message}");
                throw new Exception("Failed to add track to Firestore.", ex);
            }
        }

        // Get a track by its Spotify ID
        public async Task<(bool, LastfmTrack)> GetTrackAsync(string spotifyId)
        {
            try
            {
                var trackRef = _firestore.Collection("tracks").Document(spotifyId);
                var snapshot = await trackRef.GetSnapshotAsync();

                if (snapshot.Exists)
                {
                    // Return true and the track if it exists
                    return (true, snapshot.ConvertTo<LastfmTrack>());
                }

                // Return false and null if track not found
                return (false, null);
            }
            catch (Exception ex)
            {
                // Log the exception or handle it appropriately
                Console.WriteLine($"Error getting track: {ex.Message}");
                throw new Exception("Failed to get track from Firestore.", ex);
            }
        }

        // Update a track in Firestore
        public async Task UpdateTrackAsync(LastfmTrack updatedTrack)
        {
            try
            {
                string spotifyId = updatedTrack.SpotifyId;
                var trackRef = _firestore.Collection("tracks").Document(spotifyId);
                await trackRef.SetAsync(updatedTrack, SetOptions.MergeAll); // Merge updates without overwriting entire document
            }
            catch (Exception ex)
            {
                // Log the exception or handle it appropriately
                Console.WriteLine($"Error updating track: {ex.Message}");
                throw new Exception("Failed to update track in Firestore.", ex);
            }
        }

        public async Task AddListeningHistoryAsync(string userId, ListeningHistoryEntry entry)
        {
            try
            {
                var historyRef = _firestore
                    .Collection("users")
                    .Document(userId)
                    .Collection("listening_history");

                var docId = $"{entry.TrackId}_{entry.Timestamp}";
                await historyRef.Document(docId).SetAsync(entry);
                Console.WriteLine("Added To Listening History");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error at AddListeningHistory: {ex.Message}");
                throw new Exception("Failed to add track to the listening history.", ex);
            }
        }

        public async Task<bool> CheckIfHistoryEntryExists(string userId, string trackId, long timestamp)
        {
            try
            {
                var docId = $"{trackId}_{timestamp}";
                var docRef = _firestore
                        .Collection("users")
                        .Document(userId)
                        .Collection("listening_history")
                        .Document(trackId);

                var snapshot = await docRef.GetSnapshotAsync();
                return snapshot.Exists;
            }catch (Exception ex)
            {
                Console.WriteLine($"Error at CheckIfHistoryEntryExists: {ex.Message}");
                throw new Exception("Failed to check if listening history entry exists.", ex);
            }
        }

        public async Task<List<ListeningHistoryEntry>> GetListeningHistoryEntries(string userId, int limit, long? startAfter)
        {
            try
            {
                var historyRef = _firestore
                   .Collection("users")
                   .Document(userId)
                   .Collection("listening_history");

                Query query = historyRef
                        .OrderByDescending("Timestamp")
                        .Limit(limit);

                if (startAfter.HasValue) query = query.StartAfter(startAfter.Value);

                var snapshot = await query.GetSnapshotAsync();
                return snapshot.Documents
                    .Select(doc => doc.ConvertTo<ListeningHistoryEntry>())
                    .ToList();


            }catch(Exception ex)
            {
                Console.WriteLine($"Error at GetListeningHistoryEntries: {ex.Message}");
                throw new Exception("Failed to get listening history entries.", ex);
            }
           
        }

        public async Task<List<TrackWithTimestampDto>> GetListeningHistoryTracksAsync(string userId, int limit, long? startAfter)
        {
            try
            {
                var entries = await GetListeningHistoryEntries(userId, limit, startAfter);
                var result = new List<TrackWithTimestampDto>();

                foreach (var entry in entries)
                {
                    var (found, track) = await GetTrackAsync(entry.TrackId);
                    if (found && track != null)
                    {
                        result.Add(new TrackWithTimestampDto
                        {
                            Track = track,
                            Timestamp = entry.Timestamp
                        });
                    }
                    else
                    {
                        Console.WriteLine($"Track with ID {entry.TrackId} not found in database.");
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error at GetListeningHistoryTracksAsync: {ex.Message}");
                throw new Exception("Failed to get full listening history tracks.", ex);
            }
        }

    }
}

public interface IDatabaseService
{
    Task<string> AddOrUpdateUserAsync(SpotifyUser user);
    Task<SpotifyUser?> GetSpotifyUserAsync(string userId);
    Task AddTrackAsync(LastfmTrack track);
    
    Task<(bool,LastfmTrack)> GetTrackAsync(string spotifyId);

    Task UpdateTrackAsync(LastfmTrack track);
    Task<bool> CheckIfHistoryEntryExists(string userId, string trackId, long timestamp);
    Task AddListeningHistoryAsync(string userId, ListeningHistoryEntry entry);
    Task<List<ListeningHistoryEntry>> GetListeningHistoryEntries(string userId, int limit, long? startAfter);
    Task<List<TrackWithTimestampDto>> GetListeningHistoryTracksAsync(string userId, int limit, long? startAfter);

}
