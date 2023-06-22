import * as http from "node:http";
import * as jwt from "jose";
import { StatusCodes } from "http-status-codes";

interface CustomIncomingMessage extends http.IncomingMessage {
  __body?: unknown;
}

function readBody<T>(req: CustomIncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const data: Buffer[] = [];

    if (req.method?.toUpperCase() === "GET" || !req.method) {
      return resolve({} as T);
    }

    if (req.__body) {
      return resolve(req.__body as T);
    }

    req
      .on("error", (err) => {
        reject(err);
      })
      .on("data", (chunk) => {
        data.push(chunk);
      })
      .on("end", () => {
        const body = Buffer.isBuffer(data) ? Buffer.concat(data) : data;

        const isUrlEncoded =
          req.headers["content-type"] === "application/x-www-form-urlencoded";

        if (isUrlEncoded) {
          return resolve(
            Object.fromEntries(new URLSearchParams(body.toString("utf-8"))) as T
          );
        }

        try {
          const data = JSON.parse(body.toString("utf-8"));
          req.__body = data;
          return resolve(data);
        } catch {
          return resolve({} as T);
        }
      });
  });
}

interface SendArgs {
  headers?: http.IncomingHttpHeaders;
  status?: number;
  statusMessage?: string;
}

const statusMessages: Record<string, string> = {
  [StatusCodes.OK]: "Success",
  [StatusCodes.BAD_REQUEST]: "Bad Request",
  [StatusCodes.UNAUTHORIZED]: "Unauthorized",
  [StatusCodes.FORBIDDEN]: "Forbidden",
  [StatusCodes.CREATED]: "Created",
};

function send(
  res: http.ServerResponse,
  content?: Object | string,
  args?: SendArgs
) {
  args = args || {};
  args.status = args.status || 200;
  args.headers = args.headers || { "content-type": "application/json" };
  args.statusMessage =
    args.statusMessage || statusMessages[args.status] || "Success";

  content = typeof content === "object" ? JSON.stringify(content) : content;

  Object.keys(args.headers || {}).forEach((key) => {
    res.setHeader(key, args?.headers![key]!);
  });

  res.statusMessage = args.statusMessage;
  res.statusCode = args.status;
  res.writeHead(args.status, args.statusMessage);
  res.write(content);
  res.end();
}

/**
 * Checks whether the user is authorized or not. Pass either a
 * token or a http headers as an argument.
 */
async function isAuthorized(
  tokenOrHeaders: string | http.IncomingHttpHeaders
): Promise<boolean> {
  let token: string | void;

  if (typeof tokenOrHeaders !== "string") {
    token = extractBearerToken(tokenOrHeaders);
  } else {
    token = tokenOrHeaders;
  }

  if (!token) {
    return false;
  }

  try {
    await jwt.jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Helper function to extract the bearer token from the request headers.
 */
function extractBearerToken(headers: http.IncomingHttpHeaders): string | void {
  const auth = headers["authorization"];

  if (!auth) {
    return;
  }

  const [authType, token] = auth.split(" ");

  switch (authType.toLowerCase()) {
    case "bearer":
      return token;
    default:
      return;
  }
}

interface AppOptions {
  withSession?: boolean;
}

function app(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
  options: AppOptions = { withSession: true }
) {
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const method = req.method?.toUpperCase() || "GET";
    const whiteList = ["/session", "/login"];
    const pathname = (req.url?.split(/\?|#/)?.[0] || "").replace("/api", "");

    // If DEMO mode is turned on, only allow requests to /session and /login
    if (
      process.env.DEMO &&
      method !== "GET" &&
      whiteList.indexOf(pathname) === -1
    ) {
      return send(res, { demo: true });
    }

    if (options.withSession && process.env.NODE_ENV !== "test") {
      let { token } = await readBody<{ token?: string }>(req);

      if (req.headers["authorization"]) {
        token = req.headers["authorization"].split("Bearer ").pop();
      }

      if (!token || !(await isAuthorized(token))) {
        return send(res, { ok: false }, { status: StatusCodes.UNAUTHORIZED });
      }
    }

    try {
      await handler(req, res);
    } catch (e) {
      const internalServerErr = { status: StatusCodes.INTERNAL_SERVER_ERROR };

      if (e instanceof Error) {
        return send(res, { error: e.message }, internalServerErr);
      }

      if (e instanceof http.IncomingMessage) {
        const body = await readBody(e);

        return send(
          res,
          {
            statusCode: e.statusCode,
            statusMessage: e.statusMessage,
            error: body,
          },
          internalServerErr
        );
      }

      console.log(e);

      return send(
        res,
        { error: "Something unexpected happened." },
        internalServerErr
      );
    }
  };
}

export default {
  app,
  isAuthorized,
  readBody,
  send,
};
