import { useState } from "react";
import axios from "axios";

const AIAssistant = ({
    taskId,
    taskTitle,
    taskDescription,
    code
}) => {

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {

        if (!message.trim() || loading) return;

        const userMessage = message;

        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: userMessage
            }
        ]);

        setMessage("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/ai/chat",
                {
                    message: userMessage,
                    taskTitle,
                    taskDescription,
                    code
                }
            );

            const aiResponse = response.data.response;

            // 1. Display the AI response in the chat.
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: aiResponse
                }
            ]);


            // 2. Save the interaction for research.
            try {
                const token = localStorage.getItem("learnerToken");

                if (!token) {
                    console.error(
                        "AI evidence logging skipped: learner token not found."
                    );
                } else {
                    const normalizedMessage = userMessage.toLowerCase();

                    let assistanceType = "OTHER";

                    if (
                        normalizedMessage.includes("complete code") ||
                        normalizedMessage.includes("full code") ||
                        normalizedMessage.includes("write the solution") ||
                        normalizedMessage.includes("give me the solution")
                    ) {
                        assistanceType = "DIRECT_SOLUTION";
                    } else if (
                        normalizedMessage.includes("hint")
                    ) {
                        assistanceType = "HINT";
                    } else if (
                        normalizedMessage.includes("debug") ||
                        normalizedMessage.includes("error") ||
                        normalizedMessage.includes("bug") ||
                        normalizedMessage.includes("fix")
                    ) {
                        assistanceType = "DEBUGGING";
                    } else if (
                        normalizedMessage.includes("explain my code") ||
                        normalizedMessage.includes("explain this code")
                    ) {
                        assistanceType = "CODE_EXPLANATION";
                    } else if (
                        normalizedMessage.includes("example")
                    ) {
                        assistanceType = "EXAMPLE_REQUEST";
                    } else if (
                        normalizedMessage.includes("concept") ||
                        normalizedMessage.includes("why") ||
                        normalizedMessage.includes("what is") ||
                        normalizedMessage.includes("explain")
                    ) {
                        assistanceType = "CONCEPTUAL_EXPLANATION";
                    }

                    await axios.post(
                        "http://localhost:5000/api/ai-interactions",
                        {
                            taskId,
                            query: userMessage,
                            response: aiResponse,
                            assistanceType
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );
                }
            } catch (loggingError) {
                console.error(
                    "AI evidence logging failed:",
                    loggingError.response?.data || loggingError.message
                );
            }


        } catch (error) {
            console.error("AI Error:", error);

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content:
                        "Sorry, I couldn't generate a response. Please try again."
                }
            ]);

        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="ai-assistant">

            <div className="ai-header">

                <div className="ai-header-icon">
                    🤖
                </div>

                <div>
                    <h3>CodeLearn AI</h3>
                    <span>Programming Assistant</span>
                </div>

            </div>


            <div className="ai-messages">

                {messages.length === 0 && (

                    <div className="ai-welcome">

                        <div className="ai-welcome-icon">
                            🤖
                        </div>

                        <h4>How can I help?</h4>

                        <p>
                            Ask me about the problem, your code,
                            debugging, or programming concepts.
                        </p>

                        <div className="ai-suggestions">

                            <button
                                onClick={() =>
                                    setMessage("Give me a hint for this problem.")
                                }
                            >
                                💡 Give me a hint
                            </button>

                            <button
                                onClick={() =>
                                    setMessage("Explain my current code.")
                                }
                            >
                                📖 Explain my code
                            </button>

                            <button
                                onClick={() =>
                                    setMessage("Find the error in my code.")
                                }
                            >
                                🐛 Debug my code
                            </button>

                            <button
                                onClick={() =>
                                    setMessage("Explain the concept needed for this problem.")
                                }
                            >
                                🧠 Explain concept
                            </button>

                        </div>

                    </div>

                )}


                {messages.map((msg, index) => (

                    <div
                        key={index}
                        className={`ai-message ${msg.role === "user"
                            ? "user-message"
                            : "assistant-message"
                            }`}
                    >

                        <div className="message-role">
                            {msg.role === "user"
                                ? "You"
                                : "CodeLearn AI"}
                        </div>

                        <div className="message-content">
                            {msg.content}
                        </div>

                    </div>

                ))}


                {loading && (

                    <div className="ai-message assistant-message">

                        <div className="message-role">
                            CodeLearn AI
                        </div>

                        <div className="ai-typing">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>

                    </div>

                )}

            </div>


            <div className="ai-input-area">

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask CodeLearn AI..."
                    rows="2"
                    disabled={loading}
                />

                <button
                    className="ai-send-button"
                    onClick={sendMessage}
                    disabled={loading || !message.trim()}
                >
                    {loading ? "..." : "➤"}
                </button>

            </div>

        </div>
    );
};


export default AIAssistant;
