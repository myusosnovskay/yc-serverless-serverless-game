import { GameConfig, ServerState } from '../../common/types';

export interface ApiClient {
    moveTo(gridX: number, gridY: number): Promise<void>;
    getConfig(): Promise<GameConfig>;
    getState(): Promise<ServerState | undefined>;
}