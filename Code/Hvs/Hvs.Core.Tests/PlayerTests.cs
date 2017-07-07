using Microsoft.VisualStudio.TestTools.UnitTesting;
using Hvs.Core.Interfaces;

namespace Hvs.Core.Tests
{
	using Exceptions;

	[TestClass]
	public class PlayerTests
	{
		private const int hpRegen = 10;
		private const int energyRegen = 10;
		private const int maxResource = 100;
		private const int normalDamage = 80;
		private const int fatalDamage = 120;
		private const int normalRestoration = 20;

		private IPlayer player;

		[TestInitialize]
		public void Initialize()
		{
		}

		[TestMethod]
		public void PlayerHasMaximumResourcesAfterInitialization()
		{
			Assert.AreEqual(maxResource, player.HealthCurrent, "Health level is not at maximum");
			Assert.AreEqual(maxResource, player.EnergyCurrent, "Energy level is not at maximum");
		}

		[TestMethod]
		public void PlayerCanBeHit()
		{
			int playerHp = player.HealthCurrent;
			player.Hit(normalDamage);
			Assert.AreEqual(playerHp - normalDamage, player.HealthCurrent, "Player have not taken damage");
		}

		[TestMethod]
		[ExpectedException(typeof(PlayerIsDeadException), "Player is not dead when he gets too much damage")]
		public void PlayerCanDie()
		{
			player.Hit(fatalDamage);
		}

		[TestMethod]
		public void PlayerCanUseHisEnergy()
		{
			int playerEnergy = player.EnergyCurrent;
			var result = player.SpendEnergy(normalDamage);
			Assert.AreEqual(playerEnergy - normalDamage, player.EnergyCurrent, "Player have not lost its energy after he spent it");
			Assert.AreEqual(true, result, "Spend energy should return true if energy is successfully lost");
		}

		[TestMethod]
		public void PlayerCannotUseNoreEnergyThanHeHas()
		{
			int playerEnergy = player.EnergyCurrent;
			var result = player.SpendEnergy(fatalDamage);
			Assert.AreEqual(playerEnergy, player.EnergyCurrent, "Player have lost its energy after he tried to spend more than he has");
			Assert.AreEqual(true, result, "Spend energy should return false if the player tried to spend more than he has");
		}

		[TestMethod]
		public void PlayerCanBeHealed()
		{
			player.Hit(normalDamage);
			int playerHpBeforeHealing = player.HealthCurrent;
			player.Heal(normalRestoration);
			int playerHpAfterHealing = player.HealthCurrent;
			Assert.AreEqual(playerHpBeforeHealing + normalRestoration, playerHpAfterHealing, "Player didn't received heal");
		}

		[TestMethod]
		public void PlayerCanBeOverhealed()
		{
			player.Hit(normalDamage);
			player.Heal(fatalDamage);
			Assert.AreEqual(maxResource, player.HealthCurrent, "Player should have maximum HP after he has been overhealed");
		}

		[TestMethod]
		public void PlayerCanRestoreItsEnergy()
		{
			player.SpendEnergy(normalDamage);
			int playerEnergyBeforeRestoration = player.EnergyCurrent;
			player.RestoreEnergy(normalRestoration);
			int playerEnergyAfterRestoration = player.EnergyCurrent;
			Assert.AreEqual(playerEnergyBeforeRestoration + normalRestoration, playerEnergyAfterRestoration, "Player didn't received energy");
		}

		[TestMethod]
		public void PlayerCanOverrestoreItsEnergy()
		{
			player.SpendEnergy(normalDamage);
			player.RestoreEnergy(fatalDamage);
			Assert.AreEqual(maxResource, player.EnergyCurrent, "Player should have maximum energy after he has been overrestored");
		}
	}
}
