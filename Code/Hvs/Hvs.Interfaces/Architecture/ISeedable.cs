namespace Hvs.Interfaces.Architecture
{
	using System.Threading.Tasks;

	public interface ISeedable
	{
		Task SeedData();
	}
}