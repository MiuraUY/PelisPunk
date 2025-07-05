import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() !== '') {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex justify-center space-x-2 mb-6">
      <input
        type="text"
        placeholder="Buscar torrents..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-2 rounded bg-zinc-800 text-white w-full max-w-md"
      />
      <button type="submit" className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-500">
        Buscar
      </button>
    </form>
  );
}
