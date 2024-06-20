import { useEffect, useState } from "react";
import { useConnectWallet } from "../context/ConnectContext";

import { shortString, num } from "starknet";
import {byteArrayFromStr} from '../utils/helpers'




function MessagePage() {
  const [message, setMessage] = useState(null);
  const { address, account, messageContract } = useConnectWallet();

  
  const getMessage = async () => {
    try {
      messageContract.connect(account);
      console.log("message: ", message);
      const message = await messageContract.get_message();
    } catch (err) {
      console.log(err.message);
    }
  };
  
  useEffect(() => {
    getMessage();
  }, [address]);
  
  async function sendMessage() {
    messageContract.connect(account);
    console.log({ message })
    try {
      if (!message) return null;
      const byteArray = byteArrayFromStr(message);

      await messageContract.send_message(byteArray);
      setMessage(null);
    } catch (err) {
      console.log(err.message);
    }
  }

  return (
    <div className="mx-auto w-[550px] rounded-[20px] bg-white p-6 text-[#3a3a3a] shadow-shadowPrimary">
      <div className="mb-[21px] flex items-center justify-between font-medium">
        <h1 className="text-xl">Message Box</h1>
      </div>
      <input
        type="text"
        className="mt-3 w-full rounded-lg border-[1px] border-[#c4c4c4] px-4 py-3 outline-none"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
      />

      <button
        className="mt-[24px] w-full rounded-[50px] bg-[#430F5D] py-[10px] text-center text-base font-black text-white"
        onClick={sendMessage}
      >
        Send Message
      </button>
    </div>
  );
}

export default MessagePage;
