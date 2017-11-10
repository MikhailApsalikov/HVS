namespace Hvs.Repositories
{
	using Hvs.Entities.GameObjects;
	using Microsoft.AspNetCore.Identity;
	using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
	using Microsoft.EntityFrameworkCore;

	public class HvsDbContext : IdentityDbContext<IdentityUser>
	{
		public HvsDbContext(DbContextOptions options) : base(options)
		{
		}

		public DbSet<Spider> Spiders { get; set; }

		
	}
}