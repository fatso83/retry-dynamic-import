import { useEffect, useState } from "react";
import Confetti from "react-confetti";

export const ExpensiveComponent = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
  }, []);

  return (
    <>
      <h1>Expensive Component</h1>
      {showConfetti && <Confetti />}
    </>
  );
};

export default ExpensiveComponent;
