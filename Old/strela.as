package  {
	import flashx.textLayout.formats.Float;
	
	public class strela {
        var enable:int;
	    var pos:Number;
		var speed:int;
		public function strela() {
			    speed=6;
				enable=0;
				pos=725;
		}
		public function getEnabled():int{
			return enable;
		}
		public function setEnabled(a:int):void{
			enable=a;
		}
		
		public function destruct()
		{
			enable=0;
			pos=725;
		}		
		public function getPos():int{
			return Math.round(pos);
		}
		public function setPos(a:int):void{
			pos=a;
		}
		public function setSpeed(a:Number):void{
			speed=a;
		}
		public function tick():void{
		if (getEnabled()==1) setPos(getPos()-speed);
	    if (getPos()<-175) destruct();
		}
	}
	
}
