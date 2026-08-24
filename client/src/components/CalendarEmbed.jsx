import React, { useState, useEffect } from "react";

const CalendarEmbed = ({ currentUser }) => {
  const [calendarUrl, setCalendarUrl] = useState("");

  useEffect(() => {
    // 1. Logic to fetch user-specific calendar settings from profile/localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const me = users.find((u) => u.username === currentUser);

    // 2. Check if user has a custom calendar ID saved,
    // otherwise fallback to a default or the Hong Kong public calendar
    if (me && me.calendarId) {
      setCalendarUrl(
        `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(me.calendarId)}&ctz=Asia%2FHong_Kong`,
      );
    } else {
      // Default: Public Hong Kong Holidays or a placeholder
      setCalendarUrl(
        "https://calendar.google.com/calendar/embed?src=en.hong_kong%23holiday%40group.v.calendar.google.com&ctz=Asia%2FHong_Kong",
      );
    }
  }, [currentUser]);

  return (
    <div className="lib-calendar-container">
      <div className="lib-card-header">
        <span className="msg-section-label">Schedule & Events</span>
      </div>

      <div className="calendar-wrapper">
        <iframe
          src={calendarUrl}
          className="calendar-iframe"
          title="User Calendar"
          scrolling="no"
        />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .lib-calendar-container {
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
        }
        .calendar-wrapper {
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }
        .calendar-iframe {
          width: 100%;
          height: 350px;
          border: none;
          filter: contrast(0.9) saturate(1.1); /* Subtle Apple-style visual tweak */
        }
        .lib-card-header {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
        }
      `,
        }}
      />
    </div>
  );
};

export default CalendarEmbed;
