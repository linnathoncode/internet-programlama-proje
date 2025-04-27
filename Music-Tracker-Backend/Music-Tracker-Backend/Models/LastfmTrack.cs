using Google.Cloud.Firestore;

namespace Music_Tracker_Backend.Models
{
    [FirestoreData]

    public class LastfmTrack
    {
        [FirestoreProperty]
        public string SpotifyId { get; set; }
        [FirestoreProperty]
        public string Mbid { get; set; }
        [FirestoreProperty]
        public string Title { get; set; }
        [FirestoreProperty]
        public Album Album { get; set; }
        [FirestoreProperty]
        public Artist Artist { get; set; }
        [FirestoreProperty]
        public int Duration { get; set; }
        [FirestoreProperty]
        public List<string> Genres { get; set; }

    }
    [FirestoreData]
    public class Album
    {
        [FirestoreProperty]
        public string Mbid { get; set; }
        [FirestoreProperty]
        public string Title { get; set; }
        [FirestoreProperty]
        public List<CoverImage> CoverImages { get; set; }
        
    }
    [FirestoreData]
    public class Artist
    {
        [FirestoreProperty]
        public string Mbid { get; set;}
        [FirestoreProperty]
        public string Name { get; set; }
    }
    [FirestoreData]
    public class CoverImage
    {
        [FirestoreProperty]
        public string Url { get; set; }
        [FirestoreProperty]
        public string Size { get; set; }
    }
}
