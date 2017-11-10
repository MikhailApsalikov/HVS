using Hvs.Repositories;
using Hvs.Repositories.GameObjectRepositories;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Threading.Tasks;
using System.Net;

namespace Hvs.Tests.Repository_Tests
{
	[TestClass]
	public class SpiderRepositoryTests
    {
		public SpiderRepository Repository { get; set; }
		public HvsDbContext DbContext { get; set; }

		[TestInitialize]
		public async Task Inititalize()
		{
			DbContext = await DatabaseInititalizer.InitializeDatabaseForTests();
			Repository = new SpiderRepository(DbContext);
		}

		[TestMethod]
		public async Task GetSpiderTest()
		{
			var spider = await Repository.GetById(1);
			Assert.AreEqual(HttpStatusCode.OK, spider.ApiStatusCode);
			Assert.IsNotNull(spider.Data);
		}

		[TestMethod]
		public async Task GetAll()
		{
			var spider = await Repository.Get(null);
			Assert.AreEqual(HttpStatusCode.OK, spider.ApiStatusCode);
			Assert.IsNotNull(spider.Data);
			Assert.AreNotEqual(0, spider.Data.Count);
		}
	}
}
