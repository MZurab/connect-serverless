import {DbEnum} from "../@enum/db.enum";

export type ConnectionType = {
    db: DbEnum,
    access: any
}