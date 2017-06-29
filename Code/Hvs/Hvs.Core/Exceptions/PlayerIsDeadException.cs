using System;

namespace Hvs.Core.Exceptions
{
	internal class PlayerIsDeadException : Exception
	{
		public PlayerIsDeadException()
		{

		}

		public PlayerIsDeadException(string message) : base(message)
		{

		}

		public PlayerIsDeadException(string message, Exception innerException) : base(message, innerException)
		{

		}
	}
}
