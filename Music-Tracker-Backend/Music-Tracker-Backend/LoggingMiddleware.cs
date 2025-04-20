using Music_Tracker_Backend;

namespace Music_Tracker_Backend
{
    using Microsoft.AspNetCore.Http;
    using Microsoft.Extensions.Logging;
    using System.Threading.Tasks;
    public class LoggingMiddleware
    {
        //stores the next middleware in the pipeline
        private readonly RequestDelegate _next;
        //used for loggin the messages
        private readonly ILogger<LoggingMiddleware> _logger;

        public LoggingMiddleware(RequestDelegate next, ILogger<LoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            _logger.LogInformation($"Request started: {context.Request.Path}");

            await _next(context);
            _logger.LogInformation($"Request finished: {context.Request.Path} with Status Code: {context.Response.StatusCode}");


        }


    }
}


//to use: app.UseLoggingMiddleware
public static class LoggingMiddlewareExtension
{
    public static IApplicationBuilder UseLoggingMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<LoggingMiddleware>();
    }
}
