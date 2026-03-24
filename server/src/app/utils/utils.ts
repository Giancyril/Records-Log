import jwt      from "jsonwebtoken";
import bcrypt   from "bcrypt";
import dotenv   from "dotenv";
dotenv.config();

const JWT_SECRET  = process.env.JWT_SECRET  || "secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = Number(process.env.BCRYPT_SALTROUNDS) || 10;

const generateToken = (payload: object): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);

const verifyToken = (token: string): any =>
  jwt.verify(token, JWT_SECRET);

const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

const comparePassword = (plain: string, hashed: string): Promise<boolean> =>
  bcrypt.compare(plain, hashed);

const calculateMeta = (query: Record<string, any>, total: number) => {
  const page      = Number(query.page)  || 1;
  const limit     = Number(query.limit) || 10;
  const totalPage = Math.ceil(total / limit);
  return { page, limit, total, totalPage };
};

export const utils = { generateToken, verifyToken, hashPassword, comparePassword, calculateMeta };