using Microsoft.AspNetCore.Mvc;
using MovieWatcher.API.Models;
using Newtonsoft.Json.Linq;
using System.Globalization;

namespace MovieWatcher.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TorrentsController : ControllerBase
    {
        private readonly HttpClient httpClient = new();

        [HttpGet("recientes")]
        public async Task<IActionResult> GetTop48h()
        {
            string url = "https://apibay.org/precompiled/data_top100_48h.json";

            string json = await httpClient.GetStringAsync(url);
            JArray data = JArray.Parse(json);

            var filtrados = data
                .Where(d => d["category"]?.ToString() is "207" or "208")
                .Take(50) // Limitar para no saturar
                .Select(item => new
                {
                    RawTitle = item["name"]?.ToString(),
                    InfoHash = item["info_hash"]?.ToString(),
                    Size = item["size"]?.ToString(),
                    Category = item["category"]?.ToString(),
                    Imdb = item["imdb"]?.ToString()

                })
                .ToList();

            var resultados = new List<Torrent>();

            foreach (var item in filtrados)
            {
                string tipo = CategoriaATipo(item.Category);
                string tituloLimpio = LimpiarTitulo(item.RawTitle);

                resultados.Add(new Torrent
                {
                    Titulo = tituloLimpio,
                    MagnetLink = $"magnet:?xt=urn:btih:{item.InfoHash}",
                    Tamano = item.Size,
                    Tipo = tipo,
                    PosterUrl = await BuscarPosterTMDbAsync(tituloLimpio, tipo, item.Imdb)

                });
            }

            return Ok(resultados);
        }

        [HttpGet("buscar")]
        public async Task<IActionResult> BuscarPorNombre(string nombre)
        {
            string url = $"https://apibay.org/q.php?q={Uri.EscapeDataString(nombre)}";

            string json = await httpClient.GetStringAsync(url);
            JArray data = JArray.Parse(json);

            var filtrados = data
                .Where(d => d["category"]?.ToString() is "207" or "208")
                .Select(item => new
                {
                    RawTitle = item["name"]?.ToString(),
                    InfoHash = item["info_hash"]?.ToString(),
                    Category = item["category"]?.ToString(),
                    Imdb = item["imdb"]?.ToString()

                })
                .ToList();

            var resultados = new List<Torrent>();

            foreach (var item in filtrados)
            {
                string tipo = CategoriaATipo(item.Category);
                string tituloLimpio = LimpiarTitulo(item.RawTitle);

                resultados.Add(new Torrent
                {
                    Titulo = tituloLimpio,
                    MagnetLink = $"magnet:?xt=urn:btih:{item.InfoHash}",
                    Tipo = tipo,
                    PosterUrl = await BuscarPosterTMDbAsync(tituloLimpio, tipo, item.Imdb)

                });
            }

            return Ok(resultados);
        }

        // Métodos auxiliares

        private static string LimpiarTitulo(string titulo)
        {
            if (string.IsNullOrEmpty(titulo))
                return string.Empty;

            var limpio = titulo
                .Replace('.', ' ')
                .Replace('_', ' ')
                .ToLowerInvariant();

            var cortes = new[] { "1080p", "720p", "480p", "WEBRip", "BluRay", "BRRip", "HDRip",
        "x264", "x265", "H264", "H265", "AAC", "DTS", "WEB-DL",
        "NF", "AMZN", "HDTV", "RARBG", "YIFY", "EXTENDED", "REMASTERED",
        "DC", "DVDRip", "MULTI", "SUBBED", "UNRATED", "PROPER", "LIMITED",
        "AC3", "ETRG", "EVO", "FGT", "RARBG", "Repack" };
            foreach (var palabra in cortes)
            {
                int index = limpio.IndexOf(palabra, StringComparison.InvariantCultureIgnoreCase);
                if (index > 0)
                    limpio = limpio.Substring(0, index);
            }

            limpio = limpio.Trim();
            return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(limpio);
        }

        private static string CategoriaATipo(string category)
        {
            return category switch
            {
                "207" => "movie",
                "208" => "tv",
                _ => "unknown"
            };
        }

        private async Task<string> BuscarPosterTMDbAsync(string query, string tipo, string imdb)
        {
            string apiKey = "bb6605f446cd5a7cc23f3a1775ae0e95";

            // Intentar con IMDb ID si está disponible
            if (!string.IsNullOrWhiteSpace(imdb))
            {
                string url = $"https://api.themoviedb.org/3/find/{imdb}?api_key={apiKey}&external_source=imdb_id";
                try
                {
                    string json = await httpClient.GetStringAsync(url);
                    JObject data = JObject.Parse(json);

                    JToken resultado = null;

                    if (tipo == "movie")
                        resultado = data["movie_results"]?.FirstOrDefault();
                    else if (tipo == "tv")
                        resultado = data["tv_results"]?.FirstOrDefault();

                    if (resultado?["poster_path"] != null)
                        return $"https://image.tmdb.org/t/p/w500{resultado["poster_path"]}";
                }
                catch
                {
                    // Falló IMDb, continúa al fallback
                }
            }

            // Fallback: buscar por título
            if (!string.IsNullOrWhiteSpace(query) && tipo is "movie" or "tv")
            {
                string url = $"https://api.themoviedb.org/3/search/{tipo}?api_key={apiKey}&query={Uri.EscapeDataString(query)}&language=es-ES";
                try
                {
                    string json = await httpClient.GetStringAsync(url);
                    JObject data = JObject.Parse(json);

                    var primerResultado = data["results"]?.FirstOrDefault();
                    if (primerResultado?["poster_path"] != null)
                    {
                        return $"https://image.tmdb.org/t/p/w500{primerResultado["poster_path"]}";
                    }
                }
                catch
                {
                    // Todo falló
                }
            }

            return null;
        }

    }
}
