using Hvs.Common.Api;

namespace Hvs.Interfaces.Architecture
{
	public interface IRepository<TEntity> where TEntity : IEntity
	{
		ApiDataResponce<TEntity> GetById(long id);
		ApiDataListResponce<TEntity> Get(IFilter filter);
		ApiDataResponce<TEntity> Create(TEntity entity);
		ApiDataResponce<TEntity> Update(long id, TEntity entity);
		ApiResponse Remove(long id);
	}
}
