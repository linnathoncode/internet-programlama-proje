using Google.Cloud.Firestore;

namespace Music_Tracker_Backend.Models
{
    [FirestoreData]
    public class ListeningHistoryEntry
    {
        [FirestoreProperty]
        public string TrackId { get; set; }
        [FirestoreProperty]
        public long Timestamp { get; set; }
    }
}
