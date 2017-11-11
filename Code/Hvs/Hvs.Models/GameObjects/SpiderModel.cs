using Hvs.Interfaces.Architecture;

namespace Hvs.Models.GameObjects
{
	public class SpiderModel : IEntity
    {
		public long Id { get; set; }
		public string DisplayName { get; set; }
		public int Level { get; set; }
		public int MaxHp { get; set; }
		public double DamageCoefficient { get; set; }
		public double SpeedCoefficient { get; set; }
		public double FrequencyStart { get; set; }
		public double FrequencyMax { get; set; }
	    public double FrequencyPerLevel { get; set; }
		public string Description { get; set; }
	}
}
