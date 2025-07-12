using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using MovieWatcher.API.Models;
using Newtonsoft.Json.Linq;


namespace MovieWatcher.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PeliculasController : ControllerBase
    {
        private readonly HttpClient httpClient = new();
        private const string BASE_URL = "https://api.themoviedb.org/3";
        private const string idioma = "en-EN";
        private readonly IConfiguration _config;
        private readonly string API_KEY;
        private readonly IMemoryCache _cache;
        public PeliculasController(IConfiguration config, IMemoryCache cache)
        {
            _config = config;
            API_KEY = _config["Tmdb:ApiKey"] ?? throw new InvalidOperationException("API key de TMDb no configurada.");
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        }

        [HttpGet("populares")]
        public async Task<IActionResult> GetPopulares()
        {
           if (_cache.TryGetValue("peliculas_populares", out List<Pelicula> cachedPelis))
            {
                return Ok(cachedPelis);
            }

            string url = $"{BASE_URL}/movie/popular?api_key={API_KEY}&language={idioma}&page=1";
            string json = await httpClient.GetStringAsync(url);

            JObject data = JObject.Parse(json);

            var pelis = data["results"]
                .Select(p => new Pelicula
                {
                    Titulo = p["title"]?.ToString(),
                    Descripcion = p["overview"]?.ToString(),
                    PosterPath = p["poster_path"]?.ToString(),
                    Puntuacion = p["vote_average"]?.ToString(),
                    FechaEstreno = p["release_date"]?.ToString()
                })
                .ToList();
                       
            _cache.Set("peliculas_populares", pelis, TimeSpan.FromMinutes(30));
            return Ok(pelis);
        }

        [HttpGet("recientes")]
        public async Task<IActionResult> GetRecientes()
        {
            string url = $"{BASE_URL}/movie/now_playing?api_key={API_KEY}&language={idioma}&page=1";
            string json = await httpClient.GetStringAsync(url);

            JObject data = JObject.Parse(json);

            var pelis = data["results"]
                .Select(p => new Pelicula
                {
                    Titulo = p["title"]?.ToString(),
                    Descripcion = p["overview"]?.ToString(),
                    PosterPath = p["poster_path"]?.ToString(),
                    Puntuacion = p["vote_average"]?.ToString(),
                    FechaEstreno = p["release_date"]?.ToString()
                })
                .ToList();

            return Ok(pelis);
        }
    }
}
