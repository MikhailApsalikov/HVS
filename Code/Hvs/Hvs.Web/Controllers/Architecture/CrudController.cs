using Hvs.Common.Entities;
using Hvs.Interfaces.Architecture;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Hvs.Web.Controllers
{
	[Route("api/[controller]")]
	public abstract class CrudController<TModel, TEntity> : Controller, ICrudController<TModel, TEntity>
		where TModel : class, IEntity
		where TEntity : class, IEntity
	{
		// TODO: add mapping using automapper
		// TODO: add exception handling

		public string ControllerName => nameof(TEntity);
		protected ICrudRepository<TEntity> Repository { get; }

		protected CrudController(ICrudRepository<TEntity> repository)
		{
			Repository = repository;
		}

		[HttpDelete("{id}")]
		public virtual async Task<IActionResult> Delete(long id)
		{
			return Ok(await Repository.Remove(id));
		}

		[HttpGet]
		public virtual async Task<IActionResult> Get([FromQuery] BaseFilter<TEntity> query)
		{
			return Ok(await Repository.Get(query));
		}

		[HttpGet("{id}")]
		public virtual async Task<IActionResult> Get(long id)
		{
			return Ok(await Repository.GetById(id));
		}

		[HttpPost]
		public virtual async Task<IActionResult> Post([FromBody] TModel value)
		{
			return Ok(await Repository.Create(default(TEntity)));
		}
		[HttpPut("{id}")]
		public virtual async Task<IActionResult> Put(long id, [FromBody] TModel value)
		{
			return Ok(await Repository.Update(id, default(TEntity)));
		}
	}
}
