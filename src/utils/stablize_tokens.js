import ethers from 'ethers';
import { submitTransaction } from "./contracts";
import { supply } from './lend_tokens';
import { borrow } from './borrow_token';
export async function stablizeTokens(user, amountSupply, amountToBorrow, signer) {
   try {
    const txn1=await supply(user, amountSupply, signer);
    console.log(txn1)
    const txn2=await borrow(user, amountToBorrow, signer);
    console.log(txn2)
   } catch (error) {
    console.log("stablizing failed",error)
    return error
   }
}