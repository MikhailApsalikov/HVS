using Hvs.Common.Api;

namespace Hvs.Interfaces.Architecture
{
	using Hvs.Common.Entities;
	using System.Threading.Tasks;

	public interface ICrudRepository<TEntity> where TEntity : class, IEntity
	{
		Task<ApiDataResponce<TEntity>> GetById(long id);
		Task<ApiDataListResponce<TEntity>> Get(BaseFilter<TEntity> filter);
		Task<ApiDataResponce<TEntity>> Create(TEntity entity);
		Task<ApiDataResponce<TEntity>> Update(long id, TEntity entity);
		Task<ApiResponse> Remove(long id);
	}
}
