import { createPublicClient, http, parseAbi } from "viem";
import { celoSepolia } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// Contracts on Celo Sepolia
export const CUSD_SEPOLIA_ADDRESS = "0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80"; // 18 decimals
export const USDC_SEPOLIA_ADDRESS = "0x01C5C0122039549AD1493B8220cABEdD739BC44E"; // 6 decimals

const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
]);

const publicClient = createPublicClient({
  chain: celoSepolia,
  transport: http("https://forno.celo-sepolia.celo-testnet.org"), // Celo Sepolia RPC
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
      cUSDRaw: "0",
      usdcRaw: "0",
    };
  }

  try {
    const [cUSDRaw, usdcRaw] = await Promise.all([
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
    ]);

    // Format the balances
    const cUSD = Number(cUSDRaw) / 1e18;
    const usdc = Number(usdcRaw) / 1e6;

    return {
      cUSD,
      usdc,
      cUSDRaw: cUSDRaw.toString(),
      usdcRaw: usdcRaw.toString(),
    };
  } catch (error) {
    console.error("Failed to fetch on-chain balances:", error);
    return {
      cUSD: 0,
      usdc: 0,
      cUSDRaw: "0",
      usdcRaw: "0",
    };
  }
}
