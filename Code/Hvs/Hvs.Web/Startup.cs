using Hvs.Entities.GameObjects;
using Hvs.Interfaces.Architecture;
using Hvs.Repositories;
using Hvs.Repositories.GameObjectRepositories;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.Webpack;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Hvs.Web
{
	public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			var db = DatabaseInititalizer.InitializeDatabaseDropAlways().Result;
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services)
		{
			services.AddMvc();
			services.AddDbContext<HvsDbContext>(ServiceLifetime.Singleton, ServiceLifetime.Singleton);
			services.AddTransient<ICrudRepository<Spider>, SpiderRepository>();
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IHostingEnvironment env)
		{
			if (env.IsDevelopment())
			{
				app.UseDeveloperExceptionPage();
				app.UseWebpackDevMiddleware(new WebpackDevMiddlewareOptions
				{
					HotModuleReplacement = true
				});
			}
			else
			{
				app.UseExceptionHandler("/Home/Error");
			}

			app.UseStaticFiles();
			app.UseMvc(routes =>
			{
				routes.MapRoute(
					name: "api",
					template: "api/{controller}/{action}/{id?}");

				routes.MapRoute(
					name: "mvc",
					template: "{controller=Home}/{action=Index}/{id?}");

				routes.MapSpaFallbackRoute(
					name: "spa-fallback",
					defaults: new { controller = "Home", action = "Index" });
			});
		}
	}
}
