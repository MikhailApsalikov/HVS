namespace Hvs.Repositories.GameObjectRepositories
{
	using System.Collections.Generic;
	using System.Threading.Tasks;
	using Entities.GameObjects;
	using Interfaces.Architecture;
	using Microsoft.EntityFrameworkCore;

	public class SpiderRepository : CrudRepository<Spider>, ISeedable
	{
		public SpiderRepository(HvsDbContext dbContext) : base(dbContext)
		{
		}

		protected override DbSet<Spider> DbSet => DbContext.Spiders;

		protected override string ClassName => nameof(Spider);

		protected override void Merge(Spider source, Spider destination)
		{
			destination.DamageCoefficient = source.DamageCoefficient;
			destination.Description = source.Description;
			destination.DisplayName = source.DisplayName;
			destination.FrequencyMax = source.FrequencyMax;
			destination.FrequencyStart = source.FrequencyStart;
			destination.FrequencyPerLevel = source.FrequencyPerLevel;
			destination.Level = source.Level;
			destination.MaxHp = source.MaxHp;
			destination.SpeedCoefficient = source.SpeedCoefficient;
		}

		public static IEnumerable<Spider> InitialData()
		{
			// TODO: language, add descriptions
			return new List<Spider>
			{
				new Spider
				{
					DamageCoefficient = 1,
					Description = "Common spider....",
					DisplayName = "Spider",
					FrequencyMax = 1,
					FrequencyStart = 1,
					FrequencyPerLevel = 0,
					Level = 1,
					MaxHp = 1,
					SpeedCoefficient = 1
				},
				new Spider
				{
					DamageCoefficient = 0.7,
					Description = "Fast spider. Moves 100% faster but deals 30% less damage",
					DisplayName = "Fast Spider",
					FrequencyMax = 0.05,
					FrequencyStart = 0.05,
					FrequencyPerLevel = 0,
					Level = 20,
					MaxHp = 1,
					SpeedCoefficient = 2
				},
				new Spider
				{
					DamageCoefficient = 2,
					Description = "Poisonous spider. Deals double damage.",
					DisplayName = "Poisonous spider",
					FrequencyMax = 0.2,
					FrequencyStart = 0.01,
					FrequencyPerLevel = 0.001,
					Level = 40,
					MaxHp = 1,
					SpeedCoefficient = 1
				},
				new Spider
				{
					DamageCoefficient = 1,
					Description = "Strong spider.",
					DisplayName = "Strong spider",
					FrequencyMax = 0.5,
					FrequencyStart = 0.01,
					FrequencyPerLevel = 0.0043,
					Level = 60,
					MaxHp = 2,
					SpeedCoefficient = 1
				},
				new Spider
				{
					DamageCoefficient = 1,
					Description = "Armored spider.",
					DisplayName = "Armored spider",
					FrequencyMax = 0.2,
					FrequencyStart = 0.01,
					FrequencyPerLevel = 0.0013,
					Level = 80,
					MaxHp = 3,
					SpeedCoefficient = 0.85
				},
				new Spider
				{
					DamageCoefficient = 1,
					Description = "Heavy armored spider.",
					DisplayName = "Heavy armored spider",
					FrequencyMax = 0.07,
					FrequencyStart = 0.01,
					FrequencyPerLevel = 0.0008,
					Level = 100,
					MaxHp = 5,
					SpeedCoefficient = 0.7
				},
			};
		}

		public async Task SeedData()
		{
			await DbSet.AddRangeAsync(InitialData());
		}
	}
}