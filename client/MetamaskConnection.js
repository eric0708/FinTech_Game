// Connecting to Metamask
async function connectMetamask() {
    const provider = await detectEthereumProvider()
    if (provider) {          
        console.log('Ethereum successfully detected!')
        const chainId = await provider.request({
            method: 'eth_chainId'
        })
    } else {
        console.error('Please install MetaMask!', error)
    }
}

function sendTransaction() {
    // Basic Param setting
    const fromAddress = '0x8F608b2DdAca497AaF5d3Cbe9731ACE0c7aFfC3E'
    const toAddress = '0x67Bd94710DA1E0E636A9c024475B7436BC6FaAa3'
    const tokenAmountToSend = 0.5
    const valueToSend = (tokenAmountToSend*1000000000000000000).toString(16)

    // request transaction through metamask
    ethereum
        .request({
        method: 'eth_sendTransaction',
        params: [
            {
            from: fromAddress,
            to: toAddress,
            value: `0x${valueToSend}`,  // unit is wei
            gasPrice: '0x09184e72a000', // 10000000000000 wei, which is 0.00001 ether
            gas: '0x5208',              // gas price lowerbound is 21000 
            chainId: '0x4',
            },
        ],
        })
        .then((txHash) => console.log(txHash))
        .catch((error) => console.error);
}

async function getAccount() {
    accounts = await ethereum.request({ method: 'eth_requestAccounts' });
}

export { connectMetamask, sendTransaction, getAccount };
