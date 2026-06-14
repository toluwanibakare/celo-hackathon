import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celoSepolia } from "viem/chains";

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

const identityRegistryABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "agentURI",
        type: "string",
      },
    ],
    name: "register",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Error: Please provide a PRIVATE_KEY environment variable.");
    console.error("Usage: PRIVATE_KEY=0x... npx tsx scripts/register-agent.ts");
    process.exit(1);
  }

  // Ensure 0x prefix
  const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

  try {
    const account = privateKeyToAccount(formattedKey as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: celoSepolia,
      transport: http("https://forno.celo-sepolia.celo-testnet.org"),
    }).extend(publicActions);

    console.log(`Registering Paycon agent with owner address: ${account.address}...`);

    const metadataURI = "data:application/json;base64,eyJ0eXBlIjoiaHR0cHM6Ly9laXBzLmV0aGVyZXVtLm9yZy9FSVBTL2VpcC04MDA0I3JlZ2lzdHJhdGlvbi12MSIsIm5hbWUiOiJQYXljb24iLCJkZXNjcmlwdGlvbiI6IlBheWNvbiBpcyBhbiBBSSBGaW5hbmNpYWwgQ29hY2ggdGhhdCBoZWxwcyB1c2VycyBzYXZlLCBtYW5hZ2UgbW9uZXksIGFuZCBwYXkgYmlsbHMgb24gdGhlIENlbG8gYmxvY2tjaGFpbi4iLCJpbWFnZSI6Imh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS90b2x1d2FuaWJha2FyZS9jZWxvLWhhY2thdGhvbi9tYWluL3B1YmxpYy9pbWFnZXMvbG9nby5wbmciLCJzZXJ2aWNlcyI6W3sibmFtZSI6IndlYiIsImVuZHBvaW50IjoiaHR0cHM6Ly9naXRodWIuY29tL3RvbHV3YW5pYmFrYXJlL2NlbG8taGFja2F0aG9uIn1dLCJzdXBwb3J0ZWRUcnVzdCI6WyJyZXB1dGF0aW9uIiwidmFsaWRhdGlvbiJdfQ==";

    const txHash = await client.writeContract({
      address: IDENTITY_REGISTRY,
      abi: identityRegistryABI,
      functionName: "register",
      args: [metadataURI],
    });

    console.log(`Transaction sent! Hash: ${txHash}`);
    console.log(`Waiting for block confirmation...`);

    const receipt = await client.waitForTransactionReceipt({ hash: txHash });
    console.log("Transaction confirmed successfully!");

    // ERC-721 Transfer event topic: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
    const transferEventTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const log = receipt.logs.find(l => l.topics[0] === transferEventTopic);
    if (log && log.topics[3]) {
      const tokenId = BigInt(log.topics[3]);
      console.log(`\n🎉 SUCCESS! Your Agent ID on Celo Sepolia is: ${tokenId.toString()}`);
    } else {
      console.log(`\n🎉 SUCCESS! Transaction completed. Check your token ID on Celoscan Sepolia.`);
    }
  } catch (error) {
    console.error("Failed to register agent:", error);
  }
}

main();
