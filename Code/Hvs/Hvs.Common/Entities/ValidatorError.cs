namespace Hvs.Common.Entities
{
	public class ValidatorError
	{
		public string FieldName { get; }

		public string Text { get; }

		public ValidatorError(string text)
		{
			Text = text;
		}

		public ValidatorError(string text, string fieldName) : this(text)
		{
			FieldName = fieldName;
		}
	}
}
