import React from "react";

interface CriticalityProgressBarProps {
  score: number; // 1-10
}

const getColor = (score: number) => {
  if (score >= 8) return "bg-red-600";
  if (score >= 5) return "bg-yellow-400";
  return "bg-green-500";
};

const getLabel = (score: number) => {
  if (score >= 8) return "Critical";
  if (score >= 5) return "Moderate";
  return "Normal";
};

const CriticalityProgressBar: React.FC<CriticalityProgressBarProps> = ({ score }) => {
  const percent = (score / 10) * 100;
  const color = getColor(score);
  const label = getLabel(score);

  return (
    <div className="w-full max-w-md mx-auto my-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-lg font-semibold text-foreground-800">Criticality Score</span>
        <span className={`text-base font-bold ${color} text-white px-2 py-1 rounded`}>{label} ({score}/10)</span>
      </div>
      <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CriticalityProgressBar;
