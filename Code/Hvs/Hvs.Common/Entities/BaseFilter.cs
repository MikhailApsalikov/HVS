using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Hvs.Common.Entities
{
	public class BaseFilter<TEntity> where TEntity : class
	{
		public async Task<List<TEntity>> Apply(DbSet<TEntity> dbSet)
		{
			return await dbSet.ToListAsync();
		}
	}
}
