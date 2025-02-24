"use client";
import { use, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import ACTIONS from "@/Actions";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Editor from "@/components/Editor";
import Client from "@/components/Client";

const EditorPage = ({ params }) => {
  const socketRef = useRef(null);
  const codeRef = useRef("");
  const router = useRouter();
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  const [clients, setClients] = useState([]);
  console.log("id", socketRef?.current?.id);
  console.log("clients", clients);

  // Voice chat state
  const [isInVoiceChat, setIsInVoiceChat] = useState(false);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const username = useRef(
    localStorage.getItem("username") ||
      `User-${Math.floor(Math.random() * 1000)}`
  );

  // WebRTC configuration
  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    const init = async () => {
      socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL);

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        toast.error("Socket connection failed, try again later.");
        router.push("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: username.current,
      });

      // Existing socket handlers...
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== username.current) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // Voice chat handlers
      socketRef.current.on(ACTIONS.VOICE_OFFER, async ({ offer, from }) => {
        if (!peerConnectionsRef.current[from]) {
          const peerConnection = new RTCPeerConnection(configuration);
          peerConnectionsRef.current[from] = peerConnection;

          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
              peerConnection.addTrack(track, localStreamRef.current);
            });
          }

          peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit(ACTIONS.ICE_CANDIDATE, {
                candidate: event.candidate,
                to: from,
              });
            }
          };

          peerConnection.ontrack = (event) => {
            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.play();
          };
        }

        const pc = peerConnectionsRef.current[from];
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit(ACTIONS.VOICE_ANSWER, {
          answer,
          to: from,
        });
      });

      socketRef.current.on(ACTIONS.VOICE_ANSWER, async ({ answer, from }) => {
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      socketRef.current.on(
        ACTIONS.ICE_CANDIDATE,
        async ({ candidate, from }) => {
          const pc = peerConnectionsRef.current[from];
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      );

      socketRef.current.on("voice-chat-users-updated", ({ clients }) => {
        setClients(clients);
      });
    };

    if (roomId) {
      init();
    }

    return () => {
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  const toggleVoiceChat = async () => {
    try {
      if (!isInVoiceChat) {
        // Start voice chat
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        localStreamRef.current = stream;

        // Notify other users
        socketRef.current.emit(ACTIONS.START_VOICE_CHAT, { roomId });

        // Create peer connections with existing voice chat users
        clients.forEach((client) => {
          if (client.isInVoiceChat && client.id !== socketRef.current.id) {
            const pc = new RTCPeerConnection(configuration);
            peerConnectionsRef.current[client.id] = pc;

            stream.getTracks().forEach((track) => {
              pc.addTrack(track, stream);
            });

            pc.onicecandidate = (event) => {
              if (event.candidate) {
                socketRef.current.emit(ACTIONS.ICE_CANDIDATE, {
                  candidate: event.candidate,
                  to: client.id,
                });
              }
            };

            pc.ontrack = (event) => {
              const audio = new Audio();
              audio.srcObject = event.streams[0];
              audio.play();
            };

            pc.createOffer().then((offer) => {
              pc.setLocalDescription(offer).then(() => {
                socketRef.current.emit(ACTIONS.VOICE_OFFER, {
                  offer,
                  to: client.id,
                });
              });
            });
          }
        });
      } else {
        // Stop voice chat
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
        peerConnectionsRef.current = {};
        socketRef.current.emit(ACTIONS.END_VOICE_CHAT, { roomId });
      }

      setIsInVoiceChat(!isInVoiceChat);
    } catch (error) {
      toast.error("Error accessing microphone");
      console.error("Error accessing microphone:", error);
    }
  };

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
            {clients.map((client) => (
              <Client
                key={client.id}
                username={client.username}
                isInVoiceChat={client.isInVoiceChat}
                onVoiceToggle={
                  client.id === socketRef.current?.id
                    ? toggleVoiceChat
                    : undefined
                }
                isSelf={client.id === socketRef.current?.id}
              />
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
