const { ethers } = require('ethers');
const {sponser, provider} = require('./contracts')
import AsyncStorage from '@react-native-async-storage/async-storage';



async function sendEth(signer, to, amount) {
    
        const nonce = await provider.getTransactionCount(signer.getAddress())
        const gasPrice = await signer.getGasPrice()
        const gasLimit = await signer.estimateGas({
            to,
            value: ethers.utils.parseEther(amount),
        });

        const transaction = {
            to,
            value: ethers.utils.parseEther(amount),
            gasLimit,
            nonce,
            gasPrice
        };

        const tx = await signer.sendTransaction(transaction);
        const receipt = await tx.wait();
        console.log(`Transaction hash: ${receipt.transactionHash}`);
        
        return receipt
    
}

async function sendGho(signer, ghoContract, to, amount) {
    try {
    
        const amountWei = ethers.utils.parseUnits(amount, 'ether'); // Adjust this if your token has a different number of decimals
        const deadline = Math.floor(Date.now() / 1000) + 60 * 60 * 24;  // 24 hours from now

        const gasPrice = await provider.getGasPrice();
        const nonce = await ghoContract.nonces(signer.address);

        // Define the EIP-712 type data
        const domain = {
            name: await ghoContract.name(),
            version: '1',
            chainId: (await provider.getNetwork()).chainId,
            verifyingContract: ghoContract.address
        };

        const types = {
            Permit: [{
                name: "owner",
                type: "address"
            },
            {
                name: "spender",
                type: "address"
            },
            {
                name: "value",
                type: "uint256"
            },
            {
                name: "nonce",
                type: "uint256"
            },
            {
                name: "deadline",
                type: "uint256"
            },
            ],
        };

        const value = {
            owner: signer.address.toLowerCase(),
            spender: sponser.address.toLowerCase(),
            value: amountWei,
            nonce: nonce,
            deadline,
        };

        console.log("first")
        // Sign the EIP-712 type data
        const signature = await signer._signTypedData(domain, types, value);
        const { v, r, s } = ethers.utils.splitSignature(signature);


        //     const signature = {
        //       v: 27,
        //       r: "0xc8210e0910749aa42c690736d182d3ab463c9ae4103366918028d4adfdef5a81",
        //       s: "0x4eb08671493b7c9505f493d80b17536dc04d5b041817ce7d4b4f70ca1997703a"
        //     };
        //     {
        // }

        //     const checkk = ethers.utils.verifyTypedData(domain, types, value, signature);
        //     console.log(`Recovered signer: ${checkk}`);

        // Permit the sponser to spend tokens on behalf of the signer
        const permit = await ghoContract.connect(sponser).permit(
            signer.address,
            sponser.address,
            amountWei,
            deadline,
            v,
            r,
            s, {
            gasPrice: gasPrice,
            gasLimit: 80000 //hardcoded gas limit; change if needed
        }
        );
        await permit.wait(2) //wait 2 blocks after tx is confirmed

        // Now the provider can send the transaction
        // const gasLimit = await provider.estimateGas({
        //   to: ghoContract.address,
        //   data: ghoContract.interface.encodeFunctionData('transferFrom', [signer.address, to, amountWei]),
        // });
        console.log("permit given to",sponser.address,"to pay gas fees of our token transfer")
        const transaction = {
            to: ghoContract.address,
            data: ghoContract.interface.encodeFunctionData('transferFrom', [signer.address, to, amountWei]),
            gasLimit: 80000,
            gasPrice
        };

        const tx = await sponser.sendTransaction(transaction);
        const receipt = await tx.wait();
        console.log(`Transaction executed with hash: ${receipt.transactionHash}`);
        //set this txn to localStorage
        const data= await JSON.parse(await AsyncStorage.getItem(signer.address))
        if(data){
            await AsyncStorage.setItem(signer.address,JSON.stringify(
                [
                    ...data,
                    {
                        type:"GhoSend",
                        from:signer.address,
                        to:to,
                        amount:amount
    
    
                    }
                ]
            ))
        }else{
            await AsyncStorage.setItem(signer.address,JSON.stringify(
                [
                    
                    {
                        type:"GhoSend",
                        from:signer.address,
                        to:to,
                        amount:amount
    
    
                    }
                ]
            ))
        }
        
        return receipt;
    } catch (error) {
        console.error("Error sending GHO:", error);
    }
}

export { sendEth, sendGho }