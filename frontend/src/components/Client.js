import React from "react";
import { Mic, MicOff } from "lucide-react";

const Client = ({ username, isInVoiceChat, onVoiceToggle, isSelf }) => {
  const getRandomColor = (username) => {
    // Generate a consistent color based on the username
    let hash = 0;
    for (let i = 0; i < username?.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#FF33A1",
      "#FF8C33",
      "#33FFF3",
    ];
    return colors[Math.abs(hash) % colors?.length];
  };

  const getInitials = (name) => {
    const words = name.split(" ");
    return words
      .map((word) => word[0].toUpperCase())
      .join("")
      .slice(0, 2);
  };
  const bgColor = getRandomColor(username);
  const initials = getInitials(username);

  return (
    <div className="client flex items-center gap-2 justify-between w-full">
      <div className="flex items-center gap-2">
        <div
          className="avatar flex justify-center items-center text-white font-bold"
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "14px",
            backgroundColor: bgColor,
            fontSize: "20px",
            display: "flex",
          }}
        >
          {initials}
        </div>
        <span className="userName">{username}</span>
      </div>
      {isSelf && (
        <button
          onClick={onVoiceToggle}
          className={`p-2 rounded-full transition-colors ${
            isInVoiceChat
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          title={isInVoiceChat ? "Disable Voice" : "Enable Voice"}
        >
          {isInVoiceChat ? (
            <Mic className="w-5 h-5 text-white" />
          ) : (
            <MicOff className="w-5 h-5 text-gray-600" />
          )}
        </button>
      )}
    </div>
  );
};

export default Client;
