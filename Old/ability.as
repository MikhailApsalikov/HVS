package  {
	
	public class ability {
	  var name:String;
	  var cooldown:int;
	  var cooldownbase:int;
	  var cost:int;
	  var remark:String;
	  var levelreq:int;
	  public function ability(nam:String,cdb:int,c:int,str:String,lvl:int):void
		{
			name=nam;
			cooldownbase=cdb;
			cost=c;
			cooldown=0;
			remark=str;
			levelreq=lvl;
		}
	  public function resetCooldown():void{
			cooldown=cooldownbase;
		}
	  public function activate(energy1:int):int
	    {
			if ((energy1>=cost)&&(cooldown<=0))
			{
				energy1=energy1-cost;
				resetCooldown();
			    return energy1;
			}
			else return -1;
		}
		public function tickCooldown():void{
			if (cooldown>0) cooldown--; 
		}
		public function readycheck():int{
			if (cooldown==0) return 1;
			else return 0;
		}
		public function getName():String{
			return name;
		}
		public function getEnableLvl(lvl:int):int{
			if (lvl>=levelreq) return 1;
			else return 0;
		}
		public function getCost():int{
			return cost;
		}
		public function getCd():int{
			return cooldownbase;
		}
		public function getMark():String{
			return remark;
		}
		public function getCd1():int{
			return cooldown;
		}
		public function update(cdb:int,c:int,str:String)
		{
			cooldownbase=cdb;
			cost=c;
			remark=str;
		}
		

	}
	
}
