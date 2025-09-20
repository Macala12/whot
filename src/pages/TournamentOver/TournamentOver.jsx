import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trophy } from "lucide-react"; // nice simple icon

export default function TournamentOver() {
  const { tournamentid } = useParams();
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  // Countdown effect
  useEffect(() => {
    if (countdown === 0) {
      navigate(`/leaderboard/${tournamentid}`); // redirect after 5s
    }
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center text-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        {/* Icon */}
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />

        {/* Main text */}
        <h1 className="text-2xl font-bold mb-2">Tournament has Ended 🎉</h1>

        {/* Subtext with countdown */}
        <p className="text-gray-600">
          Redirecting to leaderboard in <b>{countdown}</b>s...
        </p>
      </div>
    </div>
  );
}
