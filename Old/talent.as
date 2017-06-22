package  {
	
	public class talent {
	    var name:String;
		var teck:int; //текущее кол-во вложенных очков
		var max:int; //максимальное кол-во вложенных очков
	    var remark:String;
		var levelreq:int;
		public function talent(nam:String,m:int,str:String,lvl:int) {
			name=nam;
            teck=0;
			max=m;
			remark=str;
			levelreq=lvl;
		}
		public function getEnableLvl(lvl:int):int{
			if (lvl>=levelreq) return 1;
			else return 0;
		}
		public function upgrade(str:String):int
		{
			if (teck==max) return 0;
			teck++;
			remark=str;
			return 1;
		}
		public function getName():String{
			return name;
		}
		public function getMark():String{
			return remark;
		}
		public function getTeck():int{
			return teck;
		}
		public function getMax():int{
			return max;
		}

	}
	
}
