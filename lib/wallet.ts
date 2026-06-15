import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { celoSepolia } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// Contracts on Celo Sepolia
export const CUSD_SEPOLIA_ADDRESS = "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80"; // 18 decimals
export const USDC_SEPOLIA_ADDRESS = "0x01C5C0122039549AD1493B8220cABEdD739BC44E"; // 6 decimals

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
]);

// Use a 10-second timeout so balance calls don't hang on a slow/rate-limited node
const publicClient = createPublicClient({
  chain: celoSepolia,
  transport: http("https://forno.celo-sepolia.celo-testnet.org", { timeout: 10_000 }),
});

/**
 * Generates a new, random Celo wallet (private key and public address).
 */
export function generateCeloWallet() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return {
    privateKey,
    address: account.address,
  };
}

/**
 * Fetches real on-chain stablecoin balances for a given address on Celo Sepolia.
 */
export async function getStablecoinBalances(address: string) {
  if (!address || !address.startsWith("0x")) {
    return {
      cUSD: 0,
      usdc: 0,
      celo: 0,
      cUSDRaw: "0",
      usdcRaw: "0",
      celoRaw: "0",
    };
  }

  try {
    const [cUSDRaw, usdcRaw, celoRaw] = await Promise.all([
      publicClient.readContract({
        address: CUSD_SEPOLIA_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      }).catch(() => 0n),
      publicClient.readContract({
        address: USDC_SEPOLIA_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      }).catch(() => 0n),
      publicClient.getBalance({
        address: address as `0x${string}`,
      }).catch(() => 0n),
    ]);

    // Format the balances
    const cUSD = Number(cUSDRaw) / 1e18;
    const usdc = Number(usdcRaw) / 1e6;
    const celo = Number(celoRaw) / 1e18;

    return {
      cUSD,
      usdc,
      celo,
      cUSDRaw: cUSDRaw.toString(),
      usdcRaw: usdcRaw.toString(),
      celoRaw: celoRaw.toString(),
    };
  } catch (error) {
    console.error("Failed to fetch on-chain balances:", error);
    return {
      cUSD: 0,
      usdc: 0,
      celo: 0,
      cUSDRaw: "0",
      usdcRaw: "0",
      celoRaw: "0",
    };
  }
}

/**
 * Executes a real stablecoin (cUSD or USDC) transfer on Celo Sepolia.
 * Signs the transaction with the sender's private key and waits for block confirmation.
 */
export async function executeStablecoinTransfer(
  senderPrivateKey: string,
  recipientAddress: string,
  amount: number,
  token: "cUSD" | "USDC"
): Promise<string> {
  const formattedKey = senderPrivateKey.startsWith("0x") ? senderPrivateKey : `0x${senderPrivateKey}`;
  const account = privateKeyToAccount(formattedKey as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    chain: celoSepolia,
    transport: http("https://forno.celo-sepolia.celo-testnet.org"),
  });

  const tokenAddress = token === "cUSD" ? CUSD_SEPOLIA_ADDRESS : USDC_SEPOLIA_ADDRESS;
  const decimals = token === "cUSD" ? 18 : 6;

  // Convert amount to base units
  const parsedAmount = BigInt(Math.round(amount * Math.pow(10, decimals)));

  const txHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipientAddress as `0x${string}`, parsedAmount],
  });

  // Wait for confirmation block
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}
