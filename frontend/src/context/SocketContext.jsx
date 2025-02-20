"use client";

import { createContext, useContext, useEffect } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext();
console.log(process.env.BACKEND_URL);

const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL);
const SocketProvider = ({ children }) => {
  useEffect(() => {
    // Basic connection logic
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  }, []);

  const sendMessage = (eventName, message) => {
    if (message.userId) {
      socket.emit(eventName, message);
    }
  };

  const receiveMessage = (eventName, callback) => {
    socket.on(eventName, callback);
  };

  return (
    <SocketContext.Provider value={{ sendMessage, receiveMessage, socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketProvider;
