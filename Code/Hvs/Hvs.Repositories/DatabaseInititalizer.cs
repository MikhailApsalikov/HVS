using Hvs.Repositories.GameObjectRepositories;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Hvs.Repositories
{
	// TODO: refactor to non-static class
	public static class DatabaseInititalizer
	{
		public static async Task<HvsDbContext> InitializeDatabaseForTests()
		{
			var optionBuilder = new DbContextOptionsBuilder<HvsDbContext>();
			optionBuilder.UseSqlServer(@"Data Source=(LocalDB)\MSSQLLocalDB;Database=HvsDatabase;Integrated Security=True;MultipleActiveResultSets=true");
			var context = new HvsDbContext(optionBuilder.Options);

			await RecreateDatabase(context);

			return context;
		}

		public static async Task RecreateDatabase(HvsDbContext context)
		{
			await context.Database.EnsureDeletedAsync();
			await context.Database.EnsureCreatedAsync();
			await SeedData(context);
		}


		private static async Task SeedData(HvsDbContext context)
		{
			await context.Spiders.AddRangeAsync(SpiderRepository.InitialData());
			await context.SaveChangesAsync();
		}
	}
}
