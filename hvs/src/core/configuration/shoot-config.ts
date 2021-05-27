import { AbilitiesEnum } from "../abilities/abilities.enum";

export const shootConfig = {
    1: {
        name: AbilitiesEnum.Shoot1,
        hotkey: "1"
    },
    2: {
        name: AbilitiesEnum.Shoot2,
        hotkey: "2"
    },
    3: {
        name: AbilitiesEnum.Shoot3,
        hotkey: "3"
    },
    4: {
        name: AbilitiesEnum.Shoot4,
        hotkey: "4"
    },
    5: {
        name: AbilitiesEnum.Shoot5,
        hotkey: "5"
    },
    6: {
        name: AbilitiesEnum.Shoot6,
        hotkey: "6"
    },
    7: {
        name: AbilitiesEnum.Shoot7,
        hotkey: "7"
    },
    8: {
        name: AbilitiesEnum.Shoot8,
        hotkey: "8"
    },
    9: {
        name: AbilitiesEnum.Shoot9,
        hotkey: "9"
    },
    10: {
        name: AbilitiesEnum.Shoot0,
        hotkey: "0"
    },
    11: {
        name: AbilitiesEnum.ShootDash,
        hotkey: "-"
    },
} as { [key: number]: { name: AbilitiesEnum, hotkey: string } }
