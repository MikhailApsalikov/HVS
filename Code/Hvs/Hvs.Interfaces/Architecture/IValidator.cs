using Hvs.Common.Entities;
using System.Collections.Generic;

namespace Hvs.Interfaces.Architecture
{
	public interface IValidator
	{
		bool IsValid { get; }
		List<ValidatorError> Errors { get; }
		void Validate();
	}
}
