import React from 'react';

function TorrentsList({ torrents }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {torrents.map((torrent) => (
        <div
          key={torrent.magnetLink}
          className="bg-gray-900 text-white rounded shadow p-3 flex flex-col justify-center items-center hover:shadow-lg transition-shadow duration-200"
        >
          {torrent.posterUrl ? (
            <img
              src={torrent.posterUrl}
              alt={torrent.titulo}
              className="mb-2 rounded w-40 md:w-48 lg:w-56 h-auto mx-auto transition-transform duration-300 transform hover:scale-105"

              loading="lazy"
            />
          ) : (
            <div className="h-48 bg-gray-700 flex items-center justify-center mb-2 text-sm w-40 md:w-48 lg:w-56 mx-auto">
              Sin imagen
            </div>
          )}

          <h3 className="font-bold text-lg mb-1">{torrent.titulo}</h3>

          <div className="flex gap-2 mt-auto">
            <a
              href={torrent.magnetLink}
              className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇ Descargar
            </a>

            <button
              onClick={() => alert('Aquí irá la función de stremear')}
              className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
            >
              🎬 Stremear
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TorrentsList;
