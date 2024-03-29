import React, { useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Image, SafeAreaView, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import SwapUiComponent from './SwapUiComponent';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import SheetModal from './SheetModal';
import { ContextApi } from '../providers/store';
import { getOut } from '../utils/swap_token';
import { wethAddress, ghoToken } from "../utils/contracts";
import { ethers } from 'ethers';
import { swapETHForExactTokens, swapTokensForEth } from '../utils/swap_token';
import { errorToast, successToast } from '../config/CallToast';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../config/toastConfig';



const SwapModal = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [getOutPrice, setGetOutPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false)
  const { selectedPayToken, ethPrice, ghoPrice, setSelectedPayToken, selectedRecieveToken, setSelectedRecieveToken, setActiveTask, panelRef, swapData, setSwapData, routerContract, signer, ghoContract } = useContext(ContextApi)


  useEffect(() => {
    const getOutPrice = async () => {
      try {
        const payAmount = ethers.utils.parseUnits(swapData.amountToPay, 18);
        if (payAmount == 0) {
          setGetOutPrice(0)
          return
        }
        const data = await getOut(
          routerContract,
          payAmount,
          selectedPayToken.symbol == "ETH" ? [wethAddress, ghoToken] : [ghoToken, wethAddress]
        )
        console.log("data entered", data)
        const amountOut = data[data.length - 1];
        const amountToReceive = ethers.utils.formatUnits(amountOut, 18);

        console.log("amtToScreen", amountToReceive)
        setGetOutPrice(amountToReceive)

      } catch (error) {
        console.log("err", error)
      }

    }
    getOutPrice()
  }, [swapData])

  const swapEthToGho = async () => {
    setIsLoading(true)
    try {
      const txn=await swapETHForExactTokens(
        ghoContract,
        routerContract,
        swapData.amountToPay,
        getOutPrice,
        signer.address
      )
      if(txn){
        setIsLoading(false)
        successToast("Token swapped successfully")
      }
    } catch (error) {
      setIsLoading(false)
      console.log(error)
      errorToast(error.message)
    }
  }


  const swapGhoToEth = async () => {

    try {
      setIsLoading(true)
      const txn = await swapTokensForEth(
        ghoContract,
        routerContract,
        swapData.amountToPay,
        getOutPrice,
        signer.address
      )
      if (txn) {
        setIsLoading(false)
        successToast("Token swapped successfully")
      }

    } catch (error) {
      setIsLoading(false)
      console.log(error)
      errorToast(error.message)

    }

  }

  const swap = () => {
    if (selectedPayToken.symbol === "ETH") {
      swapEthToGho()
    } else {
      swapGhoToEth()
    }
  }

  return (
    <SafeAreaView>

      <View>
        <View className="flex items-center space-y-2 mr-4">

          <TouchableOpacity className=" bg-[#7264FF] w-[70px] flex items-center rounded-2xl py-4 px-5" onPress={() => setModalVisible(true)}>
            <Entypo name="wallet" size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white ">Swap</Text>
        </View>

        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
        >

          <View className='bg-[#171A25] flex pt-12 flex-col h-[100vh]'>
          <Toast position='bottom' bottomOffset={80} config={toastConfig} />



            {/* top div */}
            <View className=" px-6 flex flex-row justify-between items-center">
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <View className='bg-[#10131A]/70 px-3 py-1 rounded-3xl'>

                  <Entypo name="chevron-small-left" size={30} color="white" />
                </View>
              </TouchableOpacity>
              <Text className="text-white text-center text-lg semibold">Swap Tokens</Text>
              <View className='bg-[#10131A]/70 px-5 py-2 rounded-3xl'>

                <AntDesign name="scan1" size={20} color="white" />
              </View>
            </View>

            <View className=" h-full bg px-4 py-4">
              <View className="flex flex-col space-y-2 h-[50%] relative rounded-lg">

                <View className="flex flex-col border border-[#9fa1a3]/20 rounded-3xl space-y-1 bg-[#10131A] h-[50%] p-4">
                  <View className="flex flex-row justify-between ">
                    <TouchableOpacity onPress={() => {
                      setActiveTask("pay")
                      panelRef.current.togglePanel()
                    }}>
                      <View className="flex items-center space-x-3 flex-row  py-2 rounded-2xl">
                        <Image
                          className="h-[40px] rounded-2xl  w-[40px] object-cover self-center"
                          source={{
                            uri: selectedPayToken?.logo,
                          }}
                        />

                        <View className="flex flex-col ">
                          <Text className="text-white text-xl">{selectedPayToken.symbol}</Text>
                          <Text className="text-[#9fa1a3]">{selectedPayToken.name}</Text>
                        </View>

                      </View>
                    </TouchableOpacity>
                    {/* <View className="flex flex-col items-end gap-2">
                      <TextInput
                        className="text-white text-xl  max-w-[150px]"
                        
                        
                        keyboardType="numeric"
                      />
                      <Text className="text-[#9fa1a3]">$0.00</Text>
                    </View> */}
                  </View>
                  {/* //youpay div */}
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-white font-bold text-lg">You Pay</Text>
                    <View className="flex flex-col items-end gap-2">
                      <TextInput
                        className="text-white text-xl  max-w-[150px]"
                        onChangeText={(text) => setSwapData({ ...swapData, amountToPay: text })}
                        value={swapData.amountToPay}
                        keyboardType="numeric"
                        placeholder='0.00'
                        placeholderTextColor={'#9fa1a3'}
                      />
                      <Text className="text-[#9fa1a3]">${selectedPayToken.symbol === "ETH" ? Number(swapData.amountToPay || 0) * ethPrice : Number(swapData.amountToPay || 0) * ghoPrice}</Text>
                    </View>
                  </View>
                </View>


                <View className="absolute left-[48%] top-[42%] z-10  h-[45px] w-[45px] bg-[#7264ff]  flex justify-center items-center  rounded-full border">
                  <AntDesign name="arrowdown" size={24} color="white" />
                </View>

                <View className="flex flex-col border border-[#9fa1a3]/20 rounded-3xl space-y-1 bg-[#10131A] h-[50%] p-4">
                  <View className="flex flex-row justify-between ">
                    <TouchableOpacity onPress={() => {
                      setActiveTask("recieve")
                      panelRef.current.togglePanel()
                    }}>
                      <View className="flex items-center space-x-3 flex-row  py-2 rounded-2xl">
                        <Image
                          className="h-[40px] rounded-2xl  w-[40px] object-cover self-center"
                          source={{
                            uri: selectedRecieveToken?.logo,
                          }}
                        />

                        <View className="flex flex-col ">
                          <Text className="text-white text-xl">{selectedRecieveToken.symbol}</Text>
                          <Text className="text-[#9fa1a3]">{selectedRecieveToken.name}</Text>
                        </View>

                      </View>
                    </TouchableOpacity>
                    {/* <View className="flex flex-col items-end gap-2">
                      <TextInput
                        className="text-white text-xl  max-w-[150px]"
                        keyboardType="numeric"
                      />
                      <Text className="text-[#9fa1a3]">$0.00</Text>
                    </View> */}
                  </View>
                  {/* //youpay div */}
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-white font-semibold text-lg">You Get</Text>
                    <View className="flex flex-col items-end gap-2">
                      {/* <TextInput
                        className="text-white text-xl  max-w-[150px]"
                        keyboardType="numeric"
                        value={swapData.amountToReceive}
                        onChangeText={(text)=>setSwapData({...swapData,amountToReceive:text})}
                      /> */}
                      <Text className="text-white text-lg  max-w-[150px]">{swapData.amountToPay && getOutPrice}</Text>
                      {/* <Text className="text-[#9fa1a3]">${selectedRecieveToken.symbol === "ETH" ? Number(swapData.amountToReceive || 0) * ethPrice : Number(swapData.amountToReceive || 0) * ghoPrice}</Text> */}
                    </View>
                  </View>
                </View>
              </View>
              {
                isLoading ? (
                  <TouchableOpacity className=" rounded-[30px] mt-8 space-x-4 flex flex-row justify-center  bg-[#9fa1a3] py-4">
                    <ActivityIndicator size="small" color="#10131a" />
                <Text className="text-xl text-center font-semibold   text-[#10131a]">Swaping...</Text>
              </TouchableOpacity>

                ):(
                  <TouchableOpacity className=" rounded-[30px] mt-8  bg-[#9fa1a3] py-4" onPress={() => { swap() }}>
                <Text className="text-xl text-center font-semibold   text-[#10131a]">Swap</Text>
              </TouchableOpacity>
                )
              }

            </View>

          </View>

          <SheetModal />
        </Modal>
      </View>
    </SafeAreaView>

  );
};

export default SwapModal;
