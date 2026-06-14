import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
console.log('URL exists:', !!url);
if (url) {
  console.log('URL length:', url.length);
  console.log('URL starts with postgresql:', url.startsWith('postgresql'));
  console.log('URL is placeholder asterisks:', url === '****');
}
