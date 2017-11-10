using System.Threading.Tasks;
using Hvs.Entities.GameObjects;
using Hvs.Interfaces.Architecture;
using Hvs.Models.GameObjects;
using Microsoft.AspNetCore.Mvc;
using System;
using Hvs.Common.Entities;

namespace Hvs.Web.Controllers.GameObject
{
	public class SpiderController : CrudController<SpiderModel, Spider>
	{
		public SpiderController(ICrudRepository<Spider> repository) : base(repository)
		{
		}
		
		public override Task<IActionResult> Post([FromBody] SpiderModel value)
		{
			throw new NotSupportedException();
		}
		
		public override Task<IActionResult> Delete(long id)
		{
			throw new NotSupportedException();
		}
		
		public override Task<IActionResult> Put(long id, [FromBody] SpiderModel value)
		{
			throw new NotSupportedException();
		}
	}
}
