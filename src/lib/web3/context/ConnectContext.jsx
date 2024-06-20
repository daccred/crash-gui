/* eslint-disable react/prop-types */
import React from 'react';
import { createContext, useContext, useReducer } from "react";
import { RpcProvider, Contract } from "starknet";
import message_abi from "../utils/abis/message_abi.json";

const ConnectContext = createContext();

const initialState = {
  connection: null,
  account: null,
  address: null,
  // Loading - status for when connecting or disconnecting
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        loading: true,
      };

    // stopLaoding - Incase of errors
    case "stopLoading":
      return {
        ...state,
        loading: false,
      };
    case "connectWallet":
      return {
        ...state,
        connection: action.payload.connection,
        account: action.payload.account,
        address: action.payload.address,
        loading: false,
      };
    case "disconnectWallet":
      return {
        ...state,
        connection: null,
        account: null,
        address: null,
        loading: false,
      };
    default:
      throw new Error("Action Unknown");
  }
}

const ConnectProvider = ({ children }) => {
  const [{ connection, account, address, loading }, dispatch] = useReducer(
    reducer,
    initialState,
  );

  const messageContractAddress =
    "0x6b7331232ca3bf34effacd7e68bf87728fbbd063f73c219b42aff07535457e";

  const rpc_provider = new RpcProvider({
    nodeUrl:
      "https://starknet-goerli.g.alchemy.com/v2/cmootBfOhD5Yjs5hTaEY3hf5PlFabEO_",
  });
  const messageContract = new Contract(
    message_abi,
    messageContractAddress,
    rpc_provider,
  );

  return (
    <ConnectContext.Provider
      value={{
        connection,
        address,
        account,
        dispatch,
        loading,
        rpc_provider,
        messageContract,
        messageContractAddress: messageContractAddress,
      }}
    >
      {children}
    </ConnectContext.Provider>
  );
};

function useConnectWallet() {
  const context = useContext(ConnectContext);
  if (context === undefined)
    throw new Error("Context was read outside the provider scope");

  return context;
}

export { ConnectProvider, useConnectWallet };
