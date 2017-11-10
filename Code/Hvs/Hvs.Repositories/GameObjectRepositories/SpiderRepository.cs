using Hvs.Entities.GameObjects;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace Hvs.Repositories.GameObjectRepositories
{
	public class SpiderRepository : CrudRepository<Spider>
	{
		public SpiderRepository(HvsDbContext dbContext) : base(dbContext)
		{
		}

		public override DbSet<Spider> DbSet => DbContext.Spiders;

		public override string ClassName => nameof(Spider);

		protected override void Merge(Spider source, Spider destination)
		{
			destination.DamageCoefficient = source.DamageCoefficient;
			destination.Description = source.Description;
			destination.DisplayName = source.DisplayName;
			destination.FrequencyMax = source.FrequencyMax;
			destination.FrequencyStart = source.FrequencyStart;
			destination.Level = source.Level;
			destination.MaxHp = source.MaxHp;
			destination.SpeedCoefficient = source.SpeedCoefficient;
		}

		public static IEnumerable<Spider> InitialData()
		{
			return new List<Spider>()
			{
				new Spider() {
					DamageCoefficient = 1,
					Description = "Spider",
					DisplayName = "Spider",
					FrequencyMax = 1,
					FrequencyStart = 1,
					Level = 1,
					MaxHp = 1,
					SpeedCoefficient = 1
				}
			};
		}
	}
}
