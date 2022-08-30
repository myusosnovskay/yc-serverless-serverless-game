import * as cookie from 'cookie';
import { Handler } from '@yandex-cloud/function-types';
import * as uuid from 'uuid';
import { TypedValues } from 'ydb-sdk';
import { withDb } from '../../db/with-db';
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from '../../utils/constants';
import { functionResponse } from '../../utils/function-response';
import { getAuthHash, pickAuthParameters } from '../../utils/tg-auth';
import { User } from '../../db/entity/user';
import { UserState } from '../../../common/types';
import { getGameConfig } from '../../utils/get-game-config';

const TG_CDN_PREFIX = 'https://t.me/i/userpic';

const transformAvatarUrl = (originalUrl: string): string | undefined => {
    let result: string | undefined;

    if (originalUrl.startsWith(TG_CDN_PREFIX)) {
        result = originalUrl.replace(TG_CDN_PREFIX, '/proxy/tg-avatars');
    }

    return result;
};

export const handler = withDb<Handler.Http>(async (dbSess, event, context) => {
    const authParameters = pickAuthParameters(event.queryStringParameters);
    const checkHash = await getAuthHash(authParameters);

    if (checkHash !== authParameters.hash) {
        return functionResponse({
            error: 'Bad parameters',
        }, 400);
    }

    const getUsersQuery = await dbSess.prepareQuery(`
        DECLARE $tgUserId AS UTF8;
        SELECT * FROM Users WHERE tg_user_id == $tgUserId;
    `);
    const { resultSets } = await dbSess.executeQuery(getUsersQuery, {
        $tgUserId: TypedValues.utf8(authParameters.id),
    });
    const users = User.fromResultSet(resultSets[0]);

    if (users.length === 0) {
        const gameConfig = await getGameConfig(dbSess);
        const login = authParameters.username ? `@${authParameters.username}` : `${authParameters.first_name}${authParameters.last_name}`;
        const tgAvatar = authParameters.photo_url && transformAvatarUrl(authParameters.photo_url);
        const user = new User({
            id: uuid.v4(),
            color: Math.round(0xFF_FF_FF * Math.random()).toString(16),
            gridX: Math.floor(Math.random() * gameConfig.worldGridSize[0]),
            gridY: Math.floor(Math.random() * gameConfig.worldGridSize[0]),
            tgAvatar,
            lastActive: new Date(),
            state: UserState.DEFAULT,
            tgUsername: login,
            tgUserId: authParameters.id,
        });

        const createUserQuery = await dbSess.prepareQuery(`
            DECLARE $id AS UTF8;
            DECLARE $color AS UTF8;
            DECLARE $gridX AS UINT32;
            DECLARE $gridY AS UINT32;
            DECLARE $tgAvatar AS UTF8?;
            DECLARE $lastActive AS TIMESTAMP;
            DECLARE $state AS UTF8;
            DECLARE $tgUsername AS UTF8;
            DECLARE $tgUserId AS UTF8;
            INSERT INTO Users (id, color, grid_x, grid_y, last_active, state, tg_avatar, tg_user_id, tg_username)
            VALUES ($id, $color, $gridX, $gridY, $lastActive, $state, $tgAvatar, $tgUserId, $tgUsername);
        `);

        await dbSess.executeQuery(createUserQuery, {
            $id: user.getTypedValue('id'),
            $color: user.getTypedValue('color'),
            $gridX: user.getTypedValue('gridX'),
            $gridY: user.getTypedValue('gridY'),
            $tgAvatar: user.getTypedValue('tgAvatar'),
            $lastActive: user.getTypedValue('lastActive'),
            $state: user.getTypedValue('state'),
            $tgUsername: user.getTypedValue('tgUsername'),
            $tgUserId: user.getTypedValue('tgUserId'),
        });
    }

    const autCookie = cookie.serialize(AUTH_COOKIE_NAME, JSON.stringify(authParameters), {
        path: '/',
        maxAge: AUTH_COOKIE_MAX_AGE,
        httpOnly: true,
        secure: true,
    });

    return {
        statusCode: 302,
        headers: {
            'Set-Cookie': autCookie,
            Location: '/',
        },
    };
});
