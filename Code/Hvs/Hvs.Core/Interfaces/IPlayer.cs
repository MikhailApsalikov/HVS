namespace Hvs.Core.Interfaces
{
	using System;

	internal interface IPlayer : IChangableOverTime
	{
		Int16 HealthCurrent { get; }
		Int16 HealthMax { get; }

		Int16 EnergyCurrent { get; }
		Int16 EnergyMax { get; }

		void Hit(int damage);
		bool SpendEnergy(int energyPoints);
		void Heal(int healthPoints);
		void RestoreEnergy(int energyPoints);
	}
}