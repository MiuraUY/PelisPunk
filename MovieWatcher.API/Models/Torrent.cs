namespace MovieWatcher.API.Models
    {
    public class Torrent
            {
        public string? Titulo { get; set; }
        public string? Enlace { get; set; }
        public string? Tamano { get; set; }
        public string? Calidad { get; set; }
        public string? FechaSubida { get; set; }
        public string? Seeders { get; set; }
        public string? Leechers { get; set; }
        public string? MagnetLink { get; set; }
        public string? Tipo { get; set; } // "movie" o "tv"
        public string? PosterUrl { get; set; } // URL de la imagen
    }
}