import {
    withTypeOptions, snakeToCamelCaseConversion, declareType, Types,
} from 'ydb-sdk';
import { Entity } from './entity';
import { UserState } from '../../../common/types';

interface IUserData {
    id: string;
    lastActive: Date;
    tgUserId: string;
    tgAvatar: string;
    tgUsername: string;
    color: string;
    gridX: number;
    gridY: number;
    state: UserState;
}

@withTypeOptions({ namesConversion: snakeToCamelCaseConversion })
export class User extends Entity {
    @declareType(Types.UTF8)
    public id: string;

    @declareType(Types.TIMESTAMP)
    public lastActive: Date;

    @declareType(Types.UTF8)
    public tgUserId: string;

    @declareType(Types.UTF8)
    public tgAvatar: string;

    @declareType(Types.UTF8)
    public tgUsername: string;

    @declareType(Types.UTF8)
    public color: string;

    @declareType(Types.UINT32)
    public gridX: number;

    @declareType(Types.UINT32)
    public gridY: number;

    @declareType(Types.UTF8)
    public state: UserState;

    constructor(data: IUserData) {
        super(data);

        this.id = data.id;
        this.lastActive = data.lastActive;
        this.tgUserId = data.tgUserId;
        this.tgAvatar = data.tgAvatar;
        this.tgUsername = data.tgUsername;
        this.color = data.color;
        this.gridX = data.gridX;
        this.gridY = data.gridY;
        this.state = data.state;
    }
}