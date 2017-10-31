using System.Net;

namespace Hvs.Common.Api
{
	public class ApiResponse
	{
		public HttpStatusCode ApiStatusCode { get; }
		public string ApiStatusMessage { get; }

		public ApiResponse()
		{
			ApiStatusCode = HttpStatusCode.OK;
			ApiStatusMessage = "Ok";
		}

		public ApiResponse(HttpStatusCode apiStatusCode, string apiStatusMessage)
		{
			ApiStatusCode = apiStatusCode;
			ApiStatusMessage = apiStatusMessage;
		}
	}
}
