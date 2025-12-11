// ========================================================
// File description: Create the Chatbot component that
// allows users to type in a question and get a response
// in plain language. Implements all 3 phases and the
// transition between them
// ========================================================

// Import required modules
import React, { useState, useEffect } from "react";
import { searchFAQs, suggestCategories, getCategoryFAQs, escalateQuery } from "../../api/triageAPI";
import "./Chatbot.css"; 

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(1); // 1 = keyword search, 2 = category-driven, 3 = escalation fallback
  const [pendingQuery, setPendingQuery] = useState(""); // Save original user question
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [userId, setUserId] = useState(null); // store userId from registration or login
  const [userInfo, setUserInfo] = useState(null); // full user object

  // Load user info from UserInfo.jsx (localStorage)
  useEffect(() => {
    const triageUser = JSON.parse(localStorage.getItem("triageUser"));
    if (triageUser) {
      setUserId(triageUser.User_ID);
      setUserInfo(triageUser); // store full user object to send in escalation
    }
  }, []);

  // Utility to push messages to the UI
  const addMessage = (sender, text, data = null) => {
    setMessages((prev) => [...prev, { sender, text, data }]);
  };

  // Handle user sending a message
  const handleSend = async () => {
    if (!input.trim()) return;

    const userQuery = input.trim();
    setPendingQuery(userQuery);
    setInput("");
    addMessage("user", userQuery);
    setLoading(true);

    try {
      // ============================================================
      // PHASE 1 — KEYWORD SEARCH
      // ============================================================
      const searchRes = await searchFAQs(userQuery, userId); // pass userId for logging

      if (searchRes.data.results.length > 0) {
        setPhase(1);
        addMessage(
          "bot",
          `Here are the top matching FAQs I found for: "${userQuery}"`,
          { faqs: searchRes.data.results }
        );
        setLoading(false);
        return;
      }

      // No matches, so move to Phase 2
      setPhase(2);

      // ============================================================
      // PHASE 2 — CATEGORY SUGGESTION (Helper function)
      // ============================================================
      const suggestRes = await suggestCategories(userQuery); // pass userId for logging

      // Always get list in suggestRes.data.categories
      const cats = suggestRes.data.categories || [];

      if (cats.length > 0) {
        // Show categories for user to pick
        addMessage("bot",
          "I couldn't find direct matches — please choose a category that fits best:",
          { categories: cats }
      );
      setPhase(2);
      } else {
        // This should rarely happen (no categories exist at all) — fallback escalate
        setPhase(3);
        await handleEscalation(userQuery);
      }
    } catch (err) {
      addMessage("bot", "Something went wrong. Please try again later.");
    }

    setLoading(false);
  };

  // ============================================================
  // Phase 2 — HANDLE CATEGORY SELECTION
  // ============================================================
  const handleCategorySelect = async (category) => {
    setLoading(true);
    setPhase(2);
    setSelectedCategoryId(category.Category_ID);

    addMessage("user", `Category selected: ${category.Category_Name}`);

    try {
      const res = await getCategoryFAQs(category.Category_ID, pendingQuery, userId);

      if (res.data.FAQs.length > 0) {
        addMessage(
          "bot",
          `Here are some FAQs in the category "${category.Category_Name}":`,
          { faqs: res.data.FAQs }
        );
      }

      // If few FAQs escalate fallback option
      addMessage(
        "bot",
        "This category may not fully match your question. Would you like to escalate your question?"
      );
      addMessage("bot", "Click the button below to escalate:", {
        escalate: true,
      });
    } catch (err) {
      addMessage("bot", "I had trouble loading that category.");
    }

    setLoading(false);
  };

  // ============================================================
  // PHASE 3 — ESCALATION (No-match fallback)
  // ============================================================
  const handleEscalation = async (originalQuery = pendingQuery) => {
    setPhase(3);
    setLoading(true);

     console.log("Payload data:", {
        queryText: originalQuery,
        categoryId: selectedCategoryId,
        userId: userId,
        fullName: userInfo.Full_Name,
        userEmail: userInfo.User_Email,
        userPhone: userInfo.User_Phone,
        userRole: userInfo.User_Role,
        userType: userInfo.User_Type,
    });

    try {
      const res = await escalateQuery({
        queryText: originalQuery,
        categoryId: selectedCategoryId,
        userId: userId,
        fullName: userInfo.Full_Name,
        userEmail: userInfo.User_Email,
        userPhone: userInfo.User_Phone,
        userRole: userInfo.User_Role,
        userType: userInfo.User_Type,
      });

      const staff = res.data.fallback_contact;
      addMessage(
        "bot",
        `I’m escalating your question to our staff.\n\nHere is the staff member who can assist:\n\n${staff.Full_Name} - \n ${staff.User_Email} - \n ${staff.User_Phone}`
      );

      addMessage("bot", "Your request has been logged for follow-up.");
    } catch (err) {
      addMessage("bot", "Unable to escalate at this time.");
    }

    setLoading(false);
  };

  // ============================================================
  // RENDERING
  // ============================================================
  const renderBubble = (msg, index) => {
    if (msg.sender === "user") {
      return (
        <div key={index} className="chat-bubble user">
          {msg.text}
        </div>
      );
    }

    // Bot message with FAQs
    if (msg.data?.faqs) {
      return (
        <div key={index} className="chat-bubble bot">
          <p>{msg.text}</p>
          <ul>
            {msg.data.faqs.map((faq) => (
              <li key={faq.FAQ_ID} className="faq-item">
                <strong>{faq.Question}</strong>
                <p>{faq.Answer}</p>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Bot message with categories
    if (msg.data?.categories) {
      return (
        <div key={index} className="chat-bubble bot">
          <p>{msg.text}</p>
          {msg.data.categories.map((cat) => (
            <button
              key={cat.Category_ID}
              onClick={() => handleCategorySelect(cat)}
              className="category-button"
            >
              {cat.Category_Name}
            </button>
          ))}
        </div>
      );
    }

    // Bot escalation button
    if (msg.data?.escalate) {
      return (
        <div key={index} className="chat-bubble bot">
          <button className="escalate-button" onClick={() => handleEscalation(pendingQuery)}>
            Escalate to Staff
          </button>
        </div>
      );
    }

    // Regular bot text message
    return (
      <div key={index} className="chat-bubble bot">
        {msg.text}
      </div>
    );
  };

  // Return main structure for the chatbot
  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-container">
        <div className="chatbot-header">CSEE Virtual Assistant</div>

        <div className="chat-window">
          {messages.map((msg, index) => renderBubble(msg, index))}
          {loading && <div className="bot-typing">Bot is typing...</div>}
        </div>

        <div className="chat-input-bar">
          <input
            type="text"
            placeholder="Ask me anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}