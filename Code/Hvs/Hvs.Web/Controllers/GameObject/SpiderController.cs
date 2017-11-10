using Hvs.Entities.GameObjects;
using Hvs.Interfaces.Architecture;
using Hvs.Models.GameObjects;

namespace Hvs.Web.Controllers.GameObject
{
	public class SpiderController : CrudController<SpiderModel, Spider>
	{
		protected SpiderController(ICrudRepository<Spider> repository) : base(repository)
		{
		}
	}
}
