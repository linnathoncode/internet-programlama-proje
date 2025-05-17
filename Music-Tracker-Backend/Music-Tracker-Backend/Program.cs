using Music_Tracker_Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Music_Tracker_Backend.keys;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// App convert PascalCase into camelCase by default with this 
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<LastfmService>();


//// Register HttpClient
//builder.Services.AddHttpClient<LastfmService>(client =>
//{
//    // Set up your Last.fm API base URL and other settings
//    client.BaseAddress = new Uri("https://ws.audioscrobbler.com/2.0/"); // Last.fm base URL
//    client.DefaultRequestHeaders.Add("Accept", "application/json");
//});

// Register the LastfmService with your API key (you can store it in appsettings.json)
var lastFmApiKey = Secrets.LastfmKey; 
builder.Services.AddSingleton<ILastfmService>(provider => new LastfmService(provider.GetRequiredService<HttpClient>(), lastFmApiKey));


// Services, note services must be registered before builder.Build()

// Register FirestoreService
builder.Services.AddSingleton< IDatabaseService, FirestoreService>();

// Register Spotify Service
builder.Services.AddScoped<ISpotifyService, SpotifyService>();

// JWT
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var config = builder.Configuration;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = config["JwtSettings:Issuer"],
        ValidAudience = config["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secrets.JwtSecretKey))
    };
    // allow JWT from cookies
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["jwt"];
            if (!string.IsNullOrEmpty(token))
            {
                context.Token = token;
            }
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization();
//


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseLoggingMiddleware();

app.UseRouting(); // Routing

app.UseAuthorization();

app.MapControllers();

app.Run();
