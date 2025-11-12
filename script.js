/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// OpenAI API endpoint
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// System prompt for L'Oréal chatbot
const SYSTEM_PROMPT = `You are a helpful L'Oréal beauty assistant. You should only answer questions related to:
- L'Oréal products and product recommendations
- Beauty routines and skincare advice
- Makeup tips and techniques
- Hair care and styling
- General beauty and cosmetics questions

If someone asks about topics unrelated to beauty, L'Oréal products, or cosmetics, politely redirect them back to beauty-related topics. Always be friendly, helpful, and knowledgeable about L'Oréal's product lines.`;

// Message history to maintain context
let messageHistory = [
  {
    role: "system",
    content: SYSTEM_PROMPT
  }
];

// Set initial message
chatWindow.innerHTML = `<div class="msg ai">👋 Hello! I'm your L'Oréal beauty assistant. I can help you with product recommendations, beauty routines, makeup tips, and skincare advice. How can I help you today?</div>`;

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Get user message
  const message = userInput.value.trim();
  if (!message) return;
  
  // Clear input
  userInput.value = "";
  
  // Add user message to chat
  addMessage(message, "user");
  
  // Add user message to history
  messageHistory.push({
    role: "user",
    content: message
  });
  
  try {
    // Show loading message
    addMessage("Thinking...", "ai");
    
    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messageHistory,
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    // Remove loading message
    removeLastMessage();
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    // Get response data
    const data = await response.json();
    const aiMessage = data.choices[0].message.content;
    
    // Add AI response to chat and history
    addMessage(aiMessage, "ai");
    messageHistory.push({
      role: "assistant",
      content: aiMessage
    });
    
  } catch (error) {
    // Remove loading message if there was an error
    removeLastMessage();
    
    // Show error message
    console.error("Error:", error);
    addMessage("Sorry, I'm having trouble connecting right now. Please try again!", "ai");
  }
});

/* Helper function to add messages to chat */
function addMessage(message, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `msg ${sender}`;
  messageDiv.textContent = message;
  chatWindow.appendChild(messageDiv);
  
  // Scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Helper function to remove the last message (for loading states) */
function removeLastMessage() {
  const lastMessage = chatWindow.lastElementChild;
  if (lastMessage) {
    chatWindow.removeChild(lastMessage);
  }
}
