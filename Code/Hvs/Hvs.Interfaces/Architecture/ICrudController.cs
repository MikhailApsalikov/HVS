using Microsoft.AspNetCore.Mvc;
using System;

namespace Hvs.Interfaces.Architecture
{
	public interface ICrudController<in TModel> where TModel : IEntity
	{
		string ControllerName { get; }

		IAsyncResult Get([FromQuery] IFilter query);
		IAsyncResult Get(long id);
		IAsyncResult Post([FromBody] TModel value);
		IAsyncResult Put(long id, [FromBody] TModel value);
		IAsyncResult Delete(long id);
	}
}
