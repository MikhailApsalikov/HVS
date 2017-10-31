using System.Net;

namespace Hvs.Common.Api
{
	public class ApiDataResponce<T> : ApiResponse
	{
		public T Data { get; set; }

		public ApiDataResponce(T data)
		{
			Data = data;
		}

		public ApiDataResponce(HttpStatusCode apiStatusCode, string apiStatusMessage) : base(apiStatusCode, apiStatusMessage)
		{
		}
	}
}
