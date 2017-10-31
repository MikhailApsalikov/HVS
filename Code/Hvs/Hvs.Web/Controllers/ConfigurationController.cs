using Hvs.Common.Api;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Hvs.Configuration;

namespace Hvs.Web.Controllers
{
	public class ConfigurationController : Controller
	{
		[HttpGet]
		public async Task<ApiDataResponce<MainConfiguration>> GetMainConfiguration()
		{
			return await Task.FromResult(new ApiDataResponce<MainConfiguration>(new MainConfiguration()
			{
				Language = "Russian"
			}));
		}
	}
}
