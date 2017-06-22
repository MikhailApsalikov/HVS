package  {
	
	public class spider {
		var line:int;
		var enable:int;
		var posY:Number;
		var posX:int;
		var speed:Number;
		var damage:Number;
		var slowed:Boolean;
		public function spider() {
			enable=0;
		}
		public function generate(level:int) 
		{
			enable=1;
			line=Math.round(Math.random()*9+0.5);
			posX=25+line*50;
			posY=-75;
			speed=0.2+level*0.02;
			speed=speed*(Math.random()+1);
			damage=25;
			slowed=false;
			for (var i:int=1;i<level;i++) damage=damage*1.08;
		}
		
		public function destruct()
		{
			enable=0;
			posY=-75;
		}
		public function getEnabled():int{
			return enable;
		}
		public function setEnabled(a:int):void{
			enable=a;
		}
		
		public function Slow(a:int)
		{
			if (slowed==false) 
			{
				speed=speed*(100-a)/100;
				slowed=true;
			}
		}
		public function getPosX():int{
			return posX;
		}
		public function setPosX(a:int):void{
			posX=a;
		}
		public function getPosY():int{
			return Math.round(posY);
		}
		public function setPosY(a:Number):void{
			posY=a;
		}
		public function tick():int
		{
		    if (enable==1) 
		    {
			    setPosY(posY+speed);
	            if (posY>725) 
				{
				  destruct(); 
				  return 1;
			    }
			}
			return 0;
		}
		public function getDmg():int{
			return Math.round(damage);
		}
		public function getLine():int{
			return line;
		}

	}
	
}
