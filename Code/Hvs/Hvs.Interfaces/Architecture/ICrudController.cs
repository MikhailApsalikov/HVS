using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Hvs.Interfaces.Architecture
{
	public interface ICrudController<in TModel, TEntity> 
		where TModel : IEntity 
		where TEntity : IEntity
	{
		string ControllerName { get; }

		Task<IActionResult> Get([FromQuery] IFilter<TEntity> query);
		Task<IActionResult> Get(long id);
		Task<IActionResult> Post([FromBody] TModel value);
		Task<IActionResult> Put(long id, [FromBody] TModel value);
		Task<IActionResult> Delete(long id);
	}
}
