using Hvs.Entities.GameObjects;
using Hvs.Interfaces.Architecture;
using Hvs.Repositories;
using Hvs.Repositories.GameObjectRepositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Hvs.Web.ApplicationStart
{
	public static class DependencyInjectionConfig
    {
		public static void Initialize(IServiceCollection services)
		{
			services.AddMvc();
			services.AddDbContext<HvsDbContext>((optionBuilder) => {
				optionBuilder.UseSqlServer(@"Data Source=localhost;Database=HvsDatabase;Integrated Security=True;MultipleActiveResultSets=true");
			}, ServiceLifetime.Singleton, ServiceLifetime.Singleton);
			AddRepositories(services);
		}

		private static void AddRepositories(IServiceCollection services)
		{
			services.AddSingleton<ICrudRepository<Spider>, SpiderRepository>();
		}
	}
}
