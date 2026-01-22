export type NetworkInfo = {
    chainId: string
    name: string
    explorer: string
    symbol: string
    rpc: string
}

export type GateAccountNetwork = {
    accountFormat?: string
    accountFormatName?: string
    address?: string
    network?: string
    accountPublicKey?: string
}

export type GateAccountInfo = {
    walletName?: string
    accountName?: string
    walletId?: string
    accountNetworkArr?: GateAccountNetwork[]
    moreAddressSort?: string[]
}

export type GateWalletProvider = {
    connect: () => Promise<GateAccountInfo>
    getAccount?: () => Promise<GateAccountInfo>
    getGateWalletCurrentNetwork?: () => Promise<NetworkInfo | null>
    onGateWalletNetworkChanged?: (cb: (res: NetworkInfo | null) => void) => void
    request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export function getGateWalletProvider(): GateWalletProvider | undefined {
    if (typeof window === 'undefined') return undefined
    return window.gatewallet
}

export function isGateWalletAvailable(): boolean {
    return Boolean(getGateWalletProvider())
}

export async function connectGateWallet(): Promise<GateAccountInfo> {
    const provider = getGateWalletProvider()
    if (!provider?.connect) throw new Error('Gate Wallet not detected')
    return provider.connect()
}

export async function getGateWalletCurrentNetwork(): Promise<NetworkInfo | null> {
    const provider = getGateWalletProvider()
    if (!provider?.getGateWalletCurrentNetwork) return null
    return provider.getGateWalletCurrentNetwork()
}

export async function switchGateWalletNetwork(chainId: string): Promise<void> {
    const provider = getGateWalletProvider()
    if (!provider?.request) {
        throw new Error('Gate Wallet does not support network switching via API.')
    }
    await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
    })
}

export function onGateWalletNetworkChanged(handler: (res: NetworkInfo | null) => void) {
    const provider = getGateWalletProvider()
    if (!provider?.onGateWalletNetworkChanged) return () => { }
    provider.onGateWalletNetworkChanged(handler)
    return () => { }
}

export function getPrimaryGateWalletAddress(info?: GateAccountInfo | null): string | undefined {
    const networks = info?.accountNetworkArr || []
    const evm = networks.find((item) => item?.network?.toUpperCase() === 'EVM' && item?.address)
    if (evm?.address) return evm.address
    const any = networks.find((item) => item?.address)
    return any?.address
}

declare global {
    interface Window {
        gatewallet?: GateWalletProvider
    }
}
