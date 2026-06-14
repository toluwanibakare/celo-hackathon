import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
  require.cache[require.resolve('server-only')] = {
    id: require.resolve('server-only'),
    exports: {},
    loaded: true,
    paths: [],
    children: [],
    filename: require.resolve('server-only'),
  } as any;
} catch (e) {}

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createUser, getUser } from '../lib/db/queries';
import { generateCeloWallet } from '../lib/wallet';
import { generateHashedPassword } from '../lib/db/utils';

async function main() {
  const email = 'demo@paycon.financial';
  const password = 'password123';
  const phoneNumber = '+2348026322742';

  console.log('Checking if user already exists...');
  const existingUsers = await getUser(email);
  if (existingUsers.length > 0) {
    console.log(`User ${email} already exists:`, existingUsers[0]);
    process.exit(0);
  }

  console.log('Generating wallet...');
  const wallet = generateCeloWallet();
  const hashedPassword = generateHashedPassword(password);

  console.log('Creating user in DB...');
  const [user] = await createUser(
    email,
    hashedPassword,
    phoneNumber,
    wallet.address,
    wallet.privateKey
  );

  console.log('✅ Demo user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Phone number:', phoneNumber);
  console.log('Wallet Address:', wallet.address);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed to create demo user:', err);
  process.exit(1);
});
