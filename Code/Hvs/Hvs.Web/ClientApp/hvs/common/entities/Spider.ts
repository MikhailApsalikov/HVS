import { Injectable } from '@angular/core';

@Injectable()
export class Spider {
	public DisplayName: string;
	public Level: number;
	public MaxHp: number;
	public DamageCoefficient: number;
	public SpeedCoefficient: number;
	public FrequencyStart: number;
	public FrequencyMax: number;
	public FrequencyPerLevel: number;
	public Description: string;
	public Id: number;
}