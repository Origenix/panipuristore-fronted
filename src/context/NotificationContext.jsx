import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { AuthContext } from "./AuthContext";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import toast from "react-hot-toast";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [latestNotification, setLatestNotification] = useState(null);
  const stompClientRef = useRef(null);

  useEffect(() => {
    if (
      !user ||
      (user.role !== "ROLE_ADMIN" && user.role !== "ROLE_RESTAURANT_OWNER")
    ) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const wsBaseUrl = import.meta.env.VITE_WS_URL || "https://panipuristore.onrender.com/ws";
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(wsBaseUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // console.log(str);
      },
      onConnect: () => {
        console.log("Connected to WebSocket");
        client.subscribe("/user/queue/notifications", (message) => {
          if (message.body) {
            const notification = JSON.parse(message.body);

            // Show visual toast
            toast.success(notification.message, {
              duration: 6000,
              position: "top-right",
              style: {
                background: "#10b981",
                color: "#fff",
                fontWeight: "bold",
              },
              icon: "🔔",
            });

            // Play sound & Speech
            try {
              const audio = new Audio(
                "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
              );
              audio
                .play()
                .catch((e) =>
                  console.log("Audio autoplay prevented by browser", e),
                );

              if ("speechSynthesis" in window) {
                const utterance = new SpeechSynthesisUtterance(
                  "One order has been received. Ek naya order aaya hai.",
                );
                utterance.lang = "hi-IN";
                window.speechSynthesis.speak(utterance);
              }
            } catch (e) {}

            setLatestNotification(notification);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ latestNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
