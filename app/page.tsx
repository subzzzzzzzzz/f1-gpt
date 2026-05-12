"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import f1GPTLogo from "./assets/f1GPTLogo.png";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import Bubble from "./components/Bubble";
import PromptSuggestionRow from "./components/PromptSuggestionRow";
import LoadingBubble from "./components/LoadingBubble";

const Home = () => {
  const { sendMessage, status, messages } = useChat();
  const [question, setQuestion] = useState("");

  const noMessages = !messages || messages.length === 0;

  const handlePrompt = (promptText: string) => {
    const msg: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [
        {
          type: "text",
          text: promptText,
        },
      ],
    };
    sendMessage(msg);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;

    const msg: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [
        {
          type: "text",
          text: question.trim(),
        },
      ],
    };

    sendMessage(msg);
    setQuestion("");
  };

  return (
    <main>
      <Image src={f1GPTLogo} alt="f1GPT Logo" width={250} />
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              The ultimate place for Formula One super fans! Ask F1GPT anything
              about the fantastic topic of F1 racing and it will come back with
              the most up-to-date information. We hope you enjoy your
              experience!
            </p>
            <br />
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            {(status === "submitted" || status === "streaming") && (
              <LoadingBubble />
            )}
          </>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask me something..."
        />
        <input type="submit" value="Send" />
      </form>
    </main>
  );
};

export default Home;
