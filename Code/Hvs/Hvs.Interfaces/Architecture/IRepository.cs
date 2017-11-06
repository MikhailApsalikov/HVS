using Hvs.Common.Api;

namespace Hvs.Interfaces.Architecture
{
	using System.Threading.Tasks;

	public interface IRepository<TEntity> where TEntity : IEntity
	{
		Task<ApiDataResponce<TEntity>> GetById(long id);
		Task<ApiDataListResponce<TEntity>> Get(IFilter<TEntity> filter);
		Task<ApiDataResponce<TEntity>> Create(TEntity entity);
		Task<ApiDataResponce<TEntity>> Update(long id, TEntity entity);
		Task<ApiResponse> Remove(long id);
	}
}
