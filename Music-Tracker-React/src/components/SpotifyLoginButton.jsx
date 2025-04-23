const SPOTIFY_LOGIN_URL =
  "https://accounts.spotify.com/authorize" +
  "?response_type=code" +
  "&client_id=YOUR_CLIENT_ID" +
  "&scope=user-read-private user-read-email" +
  "&redirect_uri=http://localhost:5017/callback"; // Your frontend callback

export default function SpotifyLoginButton() {
  return <a href={SPOTIFY_LOGIN_URL}>Login with Spotify</a>;
}
