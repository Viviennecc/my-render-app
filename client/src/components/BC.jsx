import React from "react";
import "./BookCard.css";

const BC = ({ book, onToggleStatus }) => {
  const { title, author, genre, status } = book;
  const isAvailable = status === "Available";

  return (
    <div className="book-card">
      <div className="book-header">
        <span className="genre-tag">{genre}</span>
        <div className={`status-pill ${status.toLowerCase()}`}>{status}</div>
      </div>

      <div className="book-body">
        <h3 className="book-title">{title}</h3>
        <p className="book-author">by {author}</p>
      </div>
    </div>
  );
};

export default BC;
