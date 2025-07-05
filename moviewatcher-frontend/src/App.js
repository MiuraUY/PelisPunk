import { useEffect, useState } from 'react';
import './App.css';
import TorrentsList from './TorrentsList';
import SearchBar from './SearchBar';

export default function App() {
  const [torrents, setTorrents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [esBusqueda, setEsBusqueda] = useState(false);

  useEffect(() => {
    // Al iniciar: cargar los recientes
    const cargarRecientes = async () => {
      try {
        const res = await fetch('http://localhost:5137/api/torrents/recientes');
        const data = await res.json();
        setTorrents(data);
      } catch (error) {
        console.error('Error al cargar torrents recientes:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarRecientes();
  }, []);

  const buscarTorrents = async (query) => {
    setLoading(true);
    setEsBusqueda(true);
    try {
      const res = await fetch(`http://localhost:5137/api/torrents/buscar?nombre=${encodeURIComponent(query)}`);
      const data = await res.json();
      setTorrents(data);
    } catch (error) {
      console.error('Error al buscar torrents:', error);
      setTorrents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold text-center mb-6">
        {esBusqueda ? 'Resultados de Búsqueda' : 'Torrents Recientes'}
      </h1>

      <SearchBar onSearch={buscarTorrents} />

      {loading && <p className="text-center mt-4">🔄 Cargando torrents...</p>}
      {!loading && torrents.length === 0 && <p className="text-center mt-4">⚠️ No se encontraron torrents.</p>}

      {!loading && torrents.length > 0 && <TorrentsList torrents={torrents} />}
    </div>
  );
}
