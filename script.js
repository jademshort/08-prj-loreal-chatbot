/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Cloudflare Worker endpoint (replaces direct OpenAI API calls)
const CLOUDFLARE_WORKER_URL =
  "https://lorealpage-worker.jademckenzieshort.workers.dev/";

// Note: API key is now securely stored in Cloudflare Worker, not exposed to users

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
    content: SYSTEM_PROMPT,
  },
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
    content: message,
  });

  try {
    // Show elegant typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "msg ai typing-indicator";
    typingDiv.innerHTML = "";
    chatWindow.appendChild(typingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Call Cloudflare Worker (handles OpenAI API securely)
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messageHistory,
      }),
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
    
    // Check if response was truncated (common signs of cutoff)
    const truncationSigns = [
      /\d+\.\s*$/, // Ends with number and period (like "7.")
      /\d+\s*$/, // Ends with just a number (like "7")
      /[^.!?]\s*$/, // Doesn't end with proper punctuation
      /\w{3,}\s*$/ // Ends with a word (incomplete sentence)
    ];
    
    let finalMessage = aiMessage;
    const seemsTruncated = truncationSigns.some(pattern => pattern.test(aiMessage.trim()));
    
    if (seemsTruncated && aiMessage.length > 200) {
      finalMessage += "\n\n💡 *Response may be incomplete. Feel free to ask me to continue or clarify!*";
    }

    // Add AI response to chat and history
    addMessage(finalMessage, "ai");
    messageHistory.push({
      role: "assistant",
      content: aiMessage, // Store original without the note
    });
  } catch (error) {
    // Remove typing indicator if there was an error
    removeLastMessage();

    // Show error message
    console.error("Error:", error);
    addMessage(
      "Sorry, I'm having trouble connecting right now. Please try again!",
      "ai"
    );
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
