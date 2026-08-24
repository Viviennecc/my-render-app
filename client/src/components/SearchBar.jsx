import React from "react";
import "./SearchBar.css";

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search for books...",
}) => {
  return (
    <div className="search-container">
      <div className="search-icon-wrapper">
        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <input
        type="text"
        className="search-input-field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="clear-btn"
          onClick={() => onChange("")}
          title="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
