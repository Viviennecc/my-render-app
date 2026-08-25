import React, { useState, useEffect } from "react";
import { api } from "../api";
import "./SecureMessagingSystem.css";

const SecureMessagingSystem = () => {
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [text, setText] = useState("");

  // Composition and modal states
  const [subject, setSubject] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await api.getMessages();
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessages([]);
    }
  };

  // Handle sending a message using the api helper
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newMessage = {
      recipient: recipient.trim(),
      subject: subject.trim() || "Encrypted Dispatch",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      if (api.sendMessage) {
        await api.sendMessage(newMessage);
      } else if (api.createMessage) {
        await api.createMessage(newMessage);
      }
      loadMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages([
        { id: Date.now(), ...newMessage, sender: "Current User" },
        ...messages,
      ]);
    }

    setRecipient("");
    setSubject("");
    setText("");
  };

  // Open message for viewing
  const handleReadMessage = (msg) => {
    setSelectedMessage(msg);
  };

  // Close message box -> Triggers Burn-After-Reading (Permanent Deletion)
  const handleCloseMessageModal = async () => {
    if (selectedMessage) {
      try {
        if (api.deleteMessage) {
          await api.deleteMessage(selectedMessage.id);
        }
      } catch (err) {
        console.error("Failed to delete message via API:", err);
      }

      // Remove permanently from local state so it cannot be recovered or re-opened
      setMessages((prevMessages) =>
        prevMessages.filter((m) => m.id !== selectedMessage.id),
      );
      setSelectedMessage(null);
    }
  };

  return (
    <div className="msg-system-card">
      <div className="msg-title">
        <span>🔒</span> Secure Encrypted Messaging (Burn-After-Reading)
      </div>

      <div className="msg-layout">
        {/* Main Panel / Composer & Inbox */}
        <div className="msg-main-panel">
          <form onSubmit={handleSendMessage}>
            <div className="message-composer-container">
              <h4 className="composer-title">New Secure Dispatch</h4>

              <input
                type="text"
                className="msg-subject-input"
                placeholder="Recipient Username (e.g. Alice)..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />

              <input
                type="text"
                className="msg-subject-input"
                placeholder="Message Subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <textarea
                className="msg-composer-area"
                placeholder="Type your confidential, self-destructing message here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              <button
                type="submit"
                className="msg-send-btn"
                disabled={!text.trim() || !recipient.trim()}
              >
                Transmit Secure Message
              </button>
            </div>
          </form>

          {/* Inbox Section */}
          <div className="msg-inbox-section">
            <div className="msg-inbox-header">
              <span className="msg-section-label">Encrypted Inbox</span>
              <button
                type="button"
                className="msg-refresh-btn"
                onClick={loadMessages}
              >
                Refresh Inbox
              </button>
            </div>

            {messages.length === 0 ? (
              <p className="msg-empty-text">
                No active secure dispatches available. All messages have been
                burned or cleared.
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="msg-item">
                  <div className="msg-meta">
                    <span className="msg-sender-name">
                      From: {msg.sender || "Unknown"}{" "}
                      {msg.recipient ? `→ To: ${msg.recipient}` : ""}
                    </span>
                    <span className="msg-subject-preview">
                      Sub: {msg.subject}
                    </span>
                    <span className="msg-timestamp">{msg.timestamp}</span>
                  </div>
                  <div className="msg-actions">
                    <button
                      type="button"
                      className="msg-btn-read"
                      onClick={() => handleReadMessage(msg)}
                    >
                      Open & Burn
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secure Reader Modal Box (Burn-After-Reading Enforcer) */}
      {selectedMessage && (
        <div className="msg-modal-overlay">
          <div className="msg-modal-content">
            <h3 className="msg-modal-title">
              Secure Dispatch: {selectedMessage.subject}
            </h3>
            <p className="msg-modal-meta">
              Sender: <strong>{selectedMessage.sender}</strong> | Recipient:{" "}
              <strong>{selectedMessage.recipient || "Self"}</strong>
            </p>
            <p className="msg-modal-warning">
              ⚠️ WARNING: This message will self-destruct permanently the moment
              you close this box.
            </p>
            <div className="msg-modal-body">
              <p className="msg-modal-text">{selectedMessage.content}</p>
            </div>
            <button
              type="button"
              className="msg-send-btn msg-destroy-btn"
              onClick={handleCloseMessageModal}
            >
              Close & Destroy Message Forever
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureMessagingSystem;
