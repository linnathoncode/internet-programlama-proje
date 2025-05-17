export default function StaticTrackItem({ track }) {
  return (
    <li className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow hover:shadow-lg transition-all">
      <div className="flex items-center space-x-4">
        <img
          src={track.imageUrl || "/default-album.png"}
          alt={track.title}
          className="w-16 h-16 object-cover rounded"
        />
        <div>
          <h2 className="text-lg font-semibold">{track.title}</h2>
          <p className="text-sm text-white/70">{track.artist?.name}</p>
          <p className="text-xs text-white/50">
            {new Date(track.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </li>
  );
}
