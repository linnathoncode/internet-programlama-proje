using Google.Cloud.Firestore;

namespace Music_Tracker_Backend.Models
{
    [FirestoreData]
    public class SpotifyUser
    {
        [FirestoreProperty] public string Id { get; set; }
        [FirestoreProperty] public string DisplayName { get; set; }
        [FirestoreProperty] public string Email { get; set; }
        [FirestoreProperty] public ProfileImage ProfileImage { get; set; }
        [FirestoreProperty] public SpotifyTokenResponse SpotifyToken { get; set; }
    }

    [FirestoreData]
    public class ProfileImage
    {
        [FirestoreProperty] public string Url { get; set; }
        [FirestoreProperty] public int Height { get; set; }
        [FirestoreProperty] public int Width { get; set; }
    }

    [FirestoreData]
    public class SpotifyTokenResponse
    {
        [FirestoreProperty] public string AccessToken { get; set; }
        [FirestoreProperty] public string TokenType { get; set; }
        [FirestoreProperty] public int ExpiresIn { get; set; }
        [FirestoreProperty] public string RefreshToken { get; set; }
        [FirestoreProperty] public string Scope { get; set; }
    }
}
