using Microsoft.AspNetCore.Mvc;
using System;

namespace Hvs.Interfaces.Architecture
{
	public interface ICrudController<in TModel, TEntity> 
		where TModel : IEntity 
		where TEntity : IEntity
	{
		string ControllerName { get; }

		IAsyncResult Get([FromQuery] IFilter<TEntity> query);
		IAsyncResult Get(long id);
		IAsyncResult Post([FromBody] TModel value);
		IAsyncResult Put(long id, [FromBody] TModel value);
		IAsyncResult Delete(long id);
	}
}
