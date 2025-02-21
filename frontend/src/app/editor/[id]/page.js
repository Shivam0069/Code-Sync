"use client";

import ACTIONS from "@/Actions";
import Client from "@/components/Client";
import Editor from "@/components/Editor";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const EditorPage = ({ params }) => {
  const socketRef = useRef(null);
  const codeRef = useRef("");
  const router = useRouter();
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  const [clients, setClients] = useState([]);
  console.log("clientsFro", clients);

  useEffect(() => {
    const init = async () => {
      socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL);

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        toast.error("Socket connection failed, try again later.");
        router.push("/");
      }

      const username =
        localStorage.getItem("username") ||
        `User-${Math.floor(Math.random() * 1000)}`;

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: username,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== localStorage.getItem("username")) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);

          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        // console.log("Before update:", clients); // Old state
        // console.log(socketId, username);

        toast.success(`${username} left the room.`);

        setClients((prevClients) => {
          console.log("Before:", prevClients);
          console.log(socketId, username);
          const updatedClients = prevClients.filter(
            (client) => client.id !== socketId
          );
          console.log("After update:", updatedClients); // New state
          return updatedClients;
        });
      });
    };

    if (roomId) {
      init();
    }

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    };
  }, [roomId]);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
    }
  }

  function leaveRoom() {
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.LEAVE);
      socketRef.current.disconnect();
    }
    router.push("/");
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <h3>Connected Users</h3>
          <div className="clientsList">
            {clients.map((client, index) => (
              <Client key={index} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy Room ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>
      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;
