import { useState, useRef, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";

import MainLayout from "../layouts/MainLayout";
import API from "../api/api";
import ChatMessage from "../components/ChatMessage";
import Loader from "../components/Loader";

const suggestions = [
  "Summarize my documents",
  "What is AI?",
  "Explain Machine Learning",
  "Generate interview questions",
];

function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendQuestion = async (text = question) => {
    if (!text.trim()) return;

    const userMessage = {
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      const response = await API.get("/query", {
        params: {
          q: text,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: response.data.answer,
        },
      ]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Something went wrong.",
        },
      ]);
    }

    setQuestion("");
    setLoading(false);

    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="mb-8 flex justify-between items-start">

          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-3xl shadow-lg">
              🤖
            </div>

            <div>

              <h1 className="text-4xl font-bold text-white">
                AI Assistant
              </h1>

              <p className="text-gray-400 mt-1">
                Chat with your uploaded documents or ask the AI anything.
              </p>

            </div>

          </div>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition shadow-md"
            >
              Clear Chat
            </button>
          )}

        </div>

        {/* Suggestion Chips */}

        {messages.length === 0 && (

          <div className="flex flex-wrap gap-3 mb-6">

            {suggestions.map((item) => (

              <button
                key={item}
                onClick={() => {
                  setQuestion(item);
                  inputRef.current?.focus();
                }}
                className="bg-slate-700 hover:bg-blue-600 transition-all duration-300 hover:scale-105 px-4 py-2 rounded-full text-sm shadow-md"
              >
                {item}
              </button>

            ))}

          </div>

        )}

        {/* Chat Box */}

        <div
          className="
            bg-gradient-to-b
            from-slate-800
            to-slate-900
            rounded-2xl
            h-[600px]
            overflow-y-auto
            p-8
            shadow-xl
            border
            border-slate-700
            space-y-6
          "
        >

          {messages.length === 0 && !loading && (

            <div className="flex flex-col items-center justify-center h-full text-center">

              <div className="text-7xl mb-5">
                💬
              </div>

              <h2 className="text-3xl font-bold text-white mb-3">
                How can I help today?
              </h2>

              <p className="text-gray-400 max-w-xl">
                Chat with your uploaded documents or ask the AI anything.
                Your assistant uses Retrieval-Augmented Generation (RAG)
                together with a Large Language Model (LLM) to provide
                intelligent answers.
              </p>

            </div>

          )}

          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              sender={msg.sender}
              text={msg.text}
            />
          ))}

          {loading && <Loader />}

          <div ref={bottomRef}></div>

        </div>

        {/* Input */}

        <div className="sticky bottom-0 bg-[#0f172a] pt-6">

          <div className="flex gap-4">

            <input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && sendQuestion()
              }
              placeholder="Chat with your documents or ask the AI anything..."
              className="
                flex-1
                bg-slate-800
                border
                border-slate-700
                focus:border-blue-500
                rounded-xl
                p-4
                outline-none
                transition
              "
            />

            <button
              disabled={loading}
              onClick={() => sendQuestion()}
              className="
                flex
                items-center
                justify-center
                gap-2
                bg-blue-600
                hover:bg-blue-700
                hover:scale-105
                transition-all
                duration-300
                disabled:bg-gray-600
                disabled:cursor-not-allowed
                disabled:hover:scale-100
                px-8
                rounded-xl
                font-semibold
                shadow-lg
              "
            >
              <FaPaperPlane className="text-sm" />
              {loading ? "Sending..." : "Send"}
            </button>

          </div>

        </div>

      </div>
    </MainLayout>
  );
}

export default Chat;