import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(".env") });


export const PRODUCT_TYPE = process.env.PRODUCT_TYPE as string;
export const FILTER_BRAND = process.env.FILTER_BRAND as string;
export const JNKB_BRAKES_URL = process.env.JNKB_BRAKES_URL as string;