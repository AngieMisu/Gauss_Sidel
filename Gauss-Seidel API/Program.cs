var builder = WebApplication.CreateBuilder(args);

// 1. Agregar servicios para los controladores
builder.Services.AddControllers();

// 2. CONFIGURAR CORS (Vital para conectar con HTML/JS)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()   // Permite cualquier origen (tu archivo HTML)
              .AllowAnyHeader()   // Permite cualquier cabecera
              .AllowAnyMethod();  // Permite GET, POST, etc.
    });
});

var app = builder.Build();

// 3. USAR CONFIGURACIONES
app.UseRouting();

// Activar la política de CORS que definimos arriba
app.UseCors();

app.UseAuthorization();

// Mapear las rutas de los controladores
app.MapControllers();

app.Run();
