import "./global.css";

export const metadata = {
  title: "F1GPT",
  description:
    "An AI assistant for Formula 1 fans, providing real-time updates, historical data, and personalized insights about the world of Formula 1 racing.",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
