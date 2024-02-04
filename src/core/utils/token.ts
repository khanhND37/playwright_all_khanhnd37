/* eslint-disable camelcase */
import type { Shop, ShopResponse, User } from "@types";
import { OcgLogger } from "@core/logger";
import { AccessTokenHeaderName, DefaultUserAgent, UserAgentHeaderName } from "@core/constant";
import { http } from "./service";
import { DataTypes, Model, Op, Sequelize } from "sequelize";

const logger = OcgLogger.get();
const shopIdTokenStorage = new Map<string, Shop>();
const shopNameTokenStorage = new Map<string, Shop>();

export type ShopOptions = {
  userId: number;
  token: string;
  domain: string;
};

type UserOptions = {
  username: string;
  password: string;
};

export enum TokenType {
  ShopToken = "ShopToken",
  CustomerToken = "CustomerToken",
}

export type DomainCredentials = {
  domain: string;
  userId?: number;
  username: string;
  password: string;
  tokenType?: TokenType;
};

/**
 * Get shop
 * @param baseURL
 * @param userId
 * @param token
 * @param domain
 */
export const getShopToken = async (baseURL, { userId, token, domain }: ShopOptions): Promise<Shop> => {
  if (shopNameTokenStorage.has(`${userId}_${domain}`)) {
    return shopNameTokenStorage.get(`${userId}_${domain}`);
  }

  try {
    const response = await http.post<ShopResponse>(`${baseURL}/v1/auth/oauth/grant-shop-access`, {
      body: {
        user_id: userId,
        shop_domain: domain,
      },
      headers: {
        [AccessTokenHeaderName]: token,
        [UserAgentHeaderName]: DefaultUserAgent,
      },
    });

    if (response.data.access_token) {
      // Comment due to issue of token vs cookie problem
      // https://ocgwp.slack.com/archives/C2SAH41PB/p1668669505502759?thread_ts=1668582839.009609&cid=C2SAH41PB
      // shopIdTokenStorage.set(`${userId}_${response.data.shop_id}`, {
      //   id: response.data.shop_id,
      //   access_token: response.data.access_token,
      // });
      // shopNameTokenStorage.set(`${userId}_${domain}`, {
      //   id: response.data.shop_id,
      //   access_token: response.data.access_token,
      // });
      return {
        access_token: response.data.access_token,
        id: response.data.shop_id,
      };
    }
  } catch (e) {
    logger.error(
      "Error when get shop's token. Please check: " +
        JSON.stringify({
          env: process.env.ENV,
          userId: userId,
          baseURL: baseURL,
          requestURL: `${baseURL}/v1/auth/oauth/grant-shop-access`,
          body: {
            user_id: userId,
            shop_domain: domain,
          },
          error: e,
        }),
    );
  }
  throw new Error("Error when get shop's token");
};

/**
 * Get user
 * @param baseURL
 * @param username
 * @param password
 */
export const getUserToken = async (baseURL, { username, password }: UserOptions): Promise<User> => {
  try {
    const response = await http.post<{
      user_id: number;
      access_token: string;
    }>(`${baseURL}/v1/auth/credentials`, {
      body: { username, password },
      headers: {
        [UserAgentHeaderName]: DefaultUserAgent,
      },
    });

    if (response.data) {
      return {
        id: response.data.user_id,
        access_token: response.data.access_token,
      };
    }
  } catch (e) {
    logger.error(
      "Error when get users's token. Please check:" +
        JSON.stringify({
          env: process.env.ENV,
          baseURL: baseURL,
          requestURL: `${baseURL}/v1/auth/credentials`,
          body: {
            username: username,
            password: password,
          },
          error: e,
        }),
    );
  }
  throw new Error("Error when get user's token");
};

/**
 * get credentials storefront from api login
 * @param baseURL
 * @param username
 * @param password
 * @returns customer token after login
 */
export const getCustomerToken = async (baseURL, { username, password }: UserOptions): Promise<User> => {
  try {
    const response = await http.post<{
      result: {
        customer_id: number;
        token: string;
      };
    }>(`${baseURL}/api/customer/next/login.json`, {
      body: { username, password },
      headers: {
        [UserAgentHeaderName]: DefaultUserAgent,
      },
    });

    if (response.status === 200) {
      return {
        id: response.data.result.customer_id,
        access_token: response.data.result.token,
      };
    }
  } catch (e) {
    logger.error(
      "Error when get customer's token. Please check:" +
        JSON.stringify({
          env: process.env.ENV,
          baseURL: baseURL,
          requestURL: `${baseURL}/api/customer/next/login.json`,
          body: {
            username: username,
            password: password,
          },
          error: e,
        }),
    );
  }
  throw new Error("Error when get customer's token");
};

export const getTokenWithCredentials = async (
  baseURL: string,
  { domain, username, password, userId, tokenType = TokenType.ShopToken }: DomainCredentials,
): Promise<Shop> => {
  if (userId && shopNameTokenStorage.has(`${userId}_${domain}`)) {
    return shopNameTokenStorage.get(`${userId}_${domain}`);
  }

  switch (tokenType) {
    case TokenType.ShopToken: {
      const user = await getUserToken(baseURL, {
        username: username,
        password: password,
      });

      return await getShopToken(baseURL, {
        userId: user.id,
        token: user.access_token,
        domain: domain,
      });
    }

    case TokenType.CustomerToken: {
      return await getCustomerToken(baseURL, {
        username: username,
        password: password,
      });
    }

    default:
      break;
  }
};

export class Token extends Model {}

if (process.env.TOKEN_STORAGE === "sql") {
  const dbConn = new Sequelize(process.env.TOKEN_SQL_CONN);
  try {
    dbConn.authenticate();
  } catch (error) {
    throw new Error("Unable to connect to the database");
  }
  Token.init(
    {
      token: { type: DataTypes.STRING(255) },
      user_id: { type: DataTypes.INTEGER },
      shop_id: { type: DataTypes.INTEGER },
      expired_at: { type: DataTypes.DATE },
    },
    {
      sequelize: dbConn,
      modelName: "shops_sessions",
      freezeTableName: true,
      timestamps: true,
    },
  );
}

export const getToken = async (userId: number, shopId: number): Promise<string> => {
  if (shopIdTokenStorage.has(`${userId}_${shopId}`)) {
    return shopIdTokenStorage.get(`${userId}_${shopId}`).access_token;
  }

  if (Token.sequelize) {
    const result = await Token.findOne({
      attributes: ["token"],
      where: {
        user_id: userId,
        shop_id: shopId,
        expired_at: { [Op.gte]: new Date() },
      },
    });
    if (
      result !== undefined &&
      result !== null &&
      result["token"] !== null &&
      result["token"] !== undefined &&
      result["token"].length > 0
    ) {
      const realToken = result["token"].replace(/aat:/, "");
      shopIdTokenStorage.set(`${userId}_${shopId}`, {
        id: shopId,
        access_token: realToken,
      });
      return realToken;
    }
  }
  throw new Error(`There is no token found for shop_id: ${shopId} and user_id: ${userId}`);
};
