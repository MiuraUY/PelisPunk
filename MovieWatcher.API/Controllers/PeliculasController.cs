using Microsoft.AspNetCore.Mvc;
using MovieWatcher.API.Models;
using Newtonsoft.Json.Linq;

namespace MovieWatcher.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PeliculasController : ControllerBase
    {
        private readonly HttpClient httpClient = new();
        private const string API_KEY = "bb6605f446cd5a7cc23f3a1775ae0e95";
        private const string BASE_URL = "https://api.themoviedb.org/3";
        private const string idioma = "en-EN";

        [HttpGet("populares")]
        public async Task<IActionResult> GetPopulares()
        {
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
