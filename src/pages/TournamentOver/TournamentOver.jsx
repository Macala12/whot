import { useEffect, useState } from "react";
import { redirect, useNavigate, useParams } from "react-router-dom";
import "../TournamentOver/index.css";
import { Trophy } from "lucide-react"; // nice simple icon

export default function TournamentOver() {
  const { tournamentid } = useParams();
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  const redirect_link = `https://octagames.ng/tournament_page?id=${tournamentid}`;

  // Countdown effect
  // useEffect(() => {
  //   if (countdown === 0) {
  //     navigate(`/leaderboard/${tournamentid}`); // redirect after 5s
  //   }
  //   const timer = setInterval(() => {
  //     setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [countdown, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center text-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        {/* Icon */}
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 trophy" />

        {/* Main text */}
        <h2 className="text-2xl font-bold mb-2">Tournament has Ended 🎉</h2>

        {/* Subtext with countdown */}
        <a className="redirect_btn" href={redirect_link}>
            Back to leaderboard
        </a>
      </div>
    </div>
  );
}
