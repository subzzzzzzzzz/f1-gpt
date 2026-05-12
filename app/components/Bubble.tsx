import { type UIMessage } from "ai";

const Bubble = ({ message }: { message: UIMessage }) => {
  const role = message.role;
  const content =
    message.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("") || "";

  return <div className={`${role} bubble`}>{content}</div>;
};

export default Bubble;
