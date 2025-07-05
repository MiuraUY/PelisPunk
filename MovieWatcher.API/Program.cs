var builder = WebApplication.CreateBuilder(args);
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Swagger + Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:3000")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});
// ?? Esto es lo que faltaba:
builder.Services.AddAuthorization();

var app = builder.Build();

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI();


app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);

// ?? Esto también es necesario para que no tire excepción:
app.UseAuthorization();

app.MapControllers();

app.Run();
