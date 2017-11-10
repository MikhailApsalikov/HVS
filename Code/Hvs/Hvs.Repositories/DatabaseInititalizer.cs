using Hvs.Repositories.GameObjectRepositories;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Hvs.Repositories
{
	public static class DatabaseInititalizer
	{
		public static async Task<HvsDbContext> InitializeDatabaseDropAlways()
		{
			var optionBuilder = new DbContextOptionsBuilder<HvsDbContext>();
			optionBuilder.UseSqlServer(@"Data Source=(LocalDB)\MSSQLLocalDB;Database=HvsDatabase;Integrated Security=True;MultipleActiveResultSets=true");
			var context = new HvsDbContext(optionBuilder.Options);

			await context.Database.EnsureDeletedAsync();
			await context.Database.EnsureCreatedAsync();

			await SeedData(context);

			return context;
		}

		private static async Task SeedData(HvsDbContext context)
		{
			await context.Spiders.AddRangeAsync(SpiderRepository.InitialData());
			await context.SaveChangesAsync();
		}
	}
}
