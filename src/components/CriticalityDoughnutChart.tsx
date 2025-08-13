import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

// Register Chart.js elements globally (should only run once)
Chart.register(ArcElement, Tooltip, Legend);

interface CriticalityDoughnutChartProps {
  score: number; // 1-10
}

const getColor = (score: number) => {
  if (score >= 8) return "#dc2626"; // red-600
  if (score >= 5) return "#facc15"; // yellow-400
  return "#22c55e"; // green-500
};

const getLabel = (score: number) => {
  if (score >= 8) return "Critical";
  if (score >= 5) return "Moderate";
  return "Normal";
};

const CriticalityDoughnutChart: React.FC<CriticalityDoughnutChartProps> = ({ score }) => {
  const color = getColor(score);
  const label = getLabel(score);
  const data = {
    datasets: [
      {
        data: [score, 10 - score],
        backgroundColor: [color, "#e5e7eb"], // gray-200 for remainder
        borderWidth: 0,
        cutout: "75%",
      },
    ],
  };

  const options = {
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Debug: show if data is invalid
  if (score === -1) {
    return (
      <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center border-2 border-red-500 bg-yellow-100">
        <span className="text-red-600 font-bold">Prediction failed or model unavailable. Please try again later.</span>
      </div>
    );
  }
  if (!score || isNaN(score) || score < 0 || score > 10) {
    return (
      <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center border-2 border-red-500 bg-yellow-100">
        <span className="text-red-600 font-bold">Invalid score for chart: {String(score)}</span>
      </div>
    );
  }

  return (
    <div className="relative w-48 h-48 mx-auto my-4" style={{ border: '2px solid red', background: '#fffbe6', zIndex: 100 }}>
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold" style={{ color }}>{score}/10</span>
        <span className="text-lg font-semibold mt-1" style={{ color }}>{label}</span>
      </div>
    </div>
  );
};

export default CriticalityDoughnutChart;
