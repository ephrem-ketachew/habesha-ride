import axios, { AxiosInstance } from 'axios';
import { SignJWT, importJWK, decodeJwt } from 'jose';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';
import AppError from './appError.util.js';

const faydaClient: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

export const generateClientAssertion = async (): Promise<string> => {
  try {
    const jwkJson = Buffer.from(
      config.fayda.privateKeyBase64,
      'base64',
    ).toString('utf8');
    const jwk = JSON.parse(jwkJson);
    const privateKey = await importJWK(jwk, 'RS256');
    const signedJwt = await new SignJWT({
      iss: config.fayda.clientId,
      sub: config.fayda.clientId,
      aud: config.fayda.tokenEndpoint,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(privateKey);
    return signedJwt;
  } catch (error: any) {
    logger.error(error, 'Failed to generate client assertion JWT');
    throw new AppError(
      'Failed to generate client assertion for Fayda authentication.',
      500,
    );
  }
};

export const exchangeCodeForTokens = async (
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<{ access_token: string; id_token: string }> => {
  try {
    const clientAssertion = await generateClientAssertion();
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.fayda.clientId,
      client_assertion: clientAssertion,
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      code_verifier: codeVerifier,
    });
    logger.info(
      { codeLength: code.length, redirectUri },
      'Exchanging authorization code for tokens',
    );
    const response = await faydaClient.post(
      config.fayda.tokenEndpoint,
      params.toString(),
    );
    if (!response.data.access_token || !response.data.id_token) {
      logger.error(
        { response: response.data },
        'Token exchange response missing required tokens',
      );
      throw new AppError('Invalid response from Fayda token endpoint.', 500);
    }
    return {
      access_token: response.data.access_token,
      id_token: response.data.id_token,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error(
        {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        },
        'Fayda token exchange failed',
      );
      if (error.response?.data?.error === 'invalid_assertion') {
        throw new AppError(
          'Invalid client assertion. Please check your private key configuration.',
          401,
        );
      }
      if (error.response?.data?.error === 'invalid_request') {
        throw new AppError(
          error.response.data.error_description ||
            'Invalid authorization code or request parameters.',
          400,
        );
      }
      throw new AppError(
        'Failed to exchange authorization code for tokens.',
        500,
      );
    }
    logger.error(error, 'Unexpected error during token exchange');
    throw error;
  }
};

export const getUserInfo = async (accessToken: string): Promise<string> => {
  try {
    logger.info('Retrieving user info from Fayda');
    const response = await faydaClient.get(config.fayda.userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (typeof response.data !== 'string') {
      logger.error(
        { response: response.data },
        'Invalid userinfo response format',
      );
      throw new AppError('Invalid userinfo response from Fayda.', 500);
    }
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      logger.error(
        {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        },
        'Fayda userinfo retrieval failed',
      );
      if (error.response?.status === 401) {
        throw new AppError('Invalid or expired access token.', 401);
      }
      throw new AppError(
        'Failed to retrieve user information from Fayda.',
        500,
      );
    }
    logger.error(error, 'Unexpected error during userinfo retrieval');
    throw error;
  }
};

export const decodeUserInfoJWT = (jwt: string): any => {
  try {
    const decoded = decodeJwt(jwt);
    const userData: any = {
      sub: decoded.sub,
    };
    if (decoded['name#en'] && decoded['name#am']) {
      userData.nameEn = decoded['name#en'];
      userData.nameAm = decoded['name#am'];
      userData.name = decoded['name#en'];
    } else if (decoded.name) {
      userData.name = decoded.name;
    }
    if (decoded['address#en'] && decoded['address#am']) {
      userData.addressEn = decoded['address#en'];
      userData.addressAm = decoded['address#am'];
      userData.address = decoded['address#en'];
    } else if (decoded.address) {
      userData.address = decoded.address;
    }
    if (decoded.birthdate) userData.birthdate = decoded.birthdate;
    if (decoded.picture) userData.picture = decoded.picture;
    if (decoded.gender) userData.gender = decoded.gender;
    if (decoded.phone_number) userData.phone_number = decoded.phone_number;
    if (decoded.email) userData.email = decoded.email;
    return userData;
  } catch (error: any) {
    logger.error(error, 'Failed to decode userinfo JWT');
    throw new AppError('Invalid userinfo JWT format.', 400);
  }
};

export const buildAuthorizationUrl = (
  codeChallenge: string,
  state: string,
  claims?: object,
): string => {
  const params = new URLSearchParams({
    client_id: config.fayda.clientId,
    response_type: 'code',
    redirect_uri: config.fayda.redirectUri,
    scope: 'openid profile email',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    claims_locales: config.fayda.claimsLocales,
  });
  if (claims) {
    params.append('claims', JSON.stringify(claims));
  }
  return `${config.fayda.authorizationEndpoint}?${params.toString()}`;
};
