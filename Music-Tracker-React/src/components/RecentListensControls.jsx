import React from "react";
import { RefreshCcw } from "lucide-react"; // Icon from lucide-react (already available in your setup)

const RecentListensControls = ({
  limit,
  onLimitChange,
  isLoading,
  onFetch,
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <label htmlFor="recent-limit" className="text-lg font-medium">
        Your recent listens:
      </label>
      <button
        onClick={onFetch}
        disabled={isLoading}
        className={`p-2 rounded-full bg-primary text-white shadow-lg transition duration-300 ${
          isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-secondary"
        }`}
        title="Refresh"
      >
        <RefreshCcw
          size={20}
          className={`transition-transform duration-300 ${
            isLoading ? "animate-spin" : ""
          }`}
        />
      </button>
    </div>
  );
};

export default RecentListensControls;
