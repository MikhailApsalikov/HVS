namespace Hvs.Entities
{
	using Interfaces.Architecture;
    public class Account : IEntity
    {
	    public long Id { get; set; }
	    public string Login { get; set; }
	    public string Password { get; set; }
	    public string Hash { get; set; }
    }
}
