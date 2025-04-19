using Google.Apis.Auth.OAuth2;
using Google.Cloud.Firestore;
using Music_Tracker_Backend.Models;

namespace Music_Tracker_Backend.Services
{
    public class FirestoreService
    {
        private readonly FirestoreDb _firestore;
        public FirestoreService(IConfiguration configuration)
        {
            var projectId = configuration["Firestore:FirestoreProjectId"];

            _firestore = FirestoreDb.Create(projectId);
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
    }
}
