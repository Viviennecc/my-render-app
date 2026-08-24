import React from "react";
import { api } from "../api";

const BookDetailsModal = ({ book, onClose, onRefresh }) => {
  const handleBorrow = async () => {
    const res = await api.toggleBorrow(book.id);
    if (res.error) alert(res.error);
    else onRefresh();
  };

  const handleDelete = async () => {
    if (window.confirm("確定要刪除這本書嗎？此操作不可逆")) {
      await api.deleteBook(book.id);
      onRefresh();
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="modal-content"
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          width: "300px",
          color: "#000",
        }}
      >
        <h3>圖書詳細資料</h3>
        <p>
          <strong>書名:</strong> {book.title}
        </p>
        <p>
          <strong>作者:</strong> {book.author}
        </p>
        <p>
          <strong>當前狀態:</strong>{" "}
          {book.status === "Available" ? "在庫" : `已被借閱`}
        </p>

        <button onClick={handleBorrow} style={{ marginRight: "10px" }}>
          {book.status === "Available" ? "立即借閱" : "歸還圖書"}
        </button>
        <button
          onClick={handleDelete}
          style={{ background: "red", color: "#fff", marginRight: "10px" }}
        >
          刪除圖書
        </button>
        <button onClick={onClose}>關閉</button>
      </div>
    </div>
  );
};

export default BookDetailsModal;
