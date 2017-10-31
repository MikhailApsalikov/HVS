using System.Collections.Generic;
using System.Net;

namespace Hvs.Common.Api
{
	public class ApiDataListResponce<T> : ApiResponse
	{
		public long TotalCount { get; set; }
		public List<T> Data { get; set; }

		public ApiDataListResponce(List<T> data, long totalCount)
		{
			Data = data;
			TotalCount = totalCount;
		}

		public ApiDataListResponce(HttpStatusCode apiStatusCode, string apiStatusMessage) : base(apiStatusCode, apiStatusMessage)
		{
		}
	}
}