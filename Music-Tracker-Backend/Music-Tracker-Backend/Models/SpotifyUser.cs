namespace Music_Tracker_Backend.Models
{
    public class SpotifyUser
    {
        public string Id { get; set; }
        public string DisplayName { get; set; }
        public string Email { get; set; }
        public ProfileImage ProfileImage { get; set; }
    }

    public class ProfileImage
    {
        public string Url { get; set; }
        public int Height { get; set; }
        public int Width { get; set; }  

    }
}
