import phaser, { Game } from 'phaser';
import { AssetFiles, AssetKeys } from '../assets';
import { Grid } from '../objects/grid/grid';
import { ConfigProvider } from '../game-config/config-provider';
import { Player } from '../objects/player';
import { GridCoords } from '../objects/grid/grid-coords';
import { GridMoveManager } from '../managers/grid-move-manager';
import { GameState } from '../state/game-state';
import { GameStatePoller } from '../state/game-state-poller';
import { ApiClient } from '../api/client';
import { PlayersStateManager } from '../managers/players-state-manager';
import { GridStateManager } from '../managers/grid-state-manager';
import { ScoreManager } from '../managers/score-manager';

export class MainScene extends phaser.Scene {
    private gameState: GameState;
    private apiClient: ApiClient;

    constructor(gameState: GameState, apiClient: ApiClient) {
        super('main');

        this.gameState = gameState;
        this.apiClient = apiClient;
    }

    private get worldSize() {
        const { worldGridSize } = ConfigProvider.getConfig();

        return GridCoords.getBoundsFromGridPos(worldGridSize[0], worldGridSize[1]);
    }

    preload() {
        this.load.image(AssetKeys.Ground, AssetFiles[AssetKeys.Ground]);
        this.load.image(AssetKeys.Player, AssetFiles[AssetKeys.Player]);
        this.load.image(AssetKeys.DefaultAvatar, AssetFiles[AssetKeys.DefaultAvatar]);
        this.load.image(AssetKeys.Progress, AssetFiles[AssetKeys.Progress]);
    }

    create() {
        const grid = new Grid(this, AssetKeys.Ground);
        const playersStateManager = new PlayersStateManager(this.gameState, this);
        const gridStateManager = new GridStateManager(this.gameState, grid);
        const me = playersStateManager.getMe();
        const gridMoveManager = new GridMoveManager(grid, me, this.apiClient);
        const scoreManager = new ScoreManager(this.gameState, this, '#score');

        this.cameras.main.startFollow(me);
        this.physics.world.setBounds(0, 0, this.worldSize[0], this.worldSize[1]);

        const gameStatePoller = new GameStatePoller(this.apiClient, this.gameState);

        gameStatePoller.start();
    }

    // update(time: number, delta: number) {}
}
