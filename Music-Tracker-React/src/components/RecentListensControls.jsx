import React from "react";

const RecentListensControls = ({
  limit,
  onLimitChange,
  isLoading,
  onFetch,
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <label htmlFor="recent-limit" className="text-lg font-medium">
        How many recent listens?
      </label>
      <select
        id="recent-limit"
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="bg-primary border border-primary/20 rounded-lg px-3 py-1 text-white text-sm backdrop-blur-md shadow-smtransition-colors duration-300"
        disabled={isLoading} // Disable select while loading
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>

      <button
        onClick={onFetch}
        disabled={isLoading}
        className={`px-6 py-2 bg-primary text-white rounded-full shadow-lg transition duration-300 ${
          isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary"
        }`}
      >
        {isLoading ? "Loading..." : "Get Recent Listens"}
      </button>
    </div>
  );
};

export default RecentListensControls;
