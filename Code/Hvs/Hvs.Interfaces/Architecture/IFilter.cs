namespace Hvs.Interfaces.Architecture
{
	using Common.Api;

	public interface IFilter<TEntity> where TEntity : IEntity
	{
		ApiDataListResponce<TEntity> Apply();
	}
}
