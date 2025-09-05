// src/App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { mockProducts } from "./data/mockData";

// UI
import Header from "./components/ui/Header";

// Pages
import HomePage from "./components/customer/HomePage";
import CartPage from "./components/customer/CartPage";
import VendorDashboard from "./components/vendor/VendorDashboard";

// OrderProvider (à créer si besoin)
import { OrderProvider } from "./context/OrderContext";

// Icône chat
import { MessageCircle } from "lucide-react";

// ================== Boîte IA ==================
const AIChatBox: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");
  const [open, setOpen] = useState(false);

  // Message de bienvenue automatique
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        "Yidam IA: Bienvenue chez Yidam Shop ! Je suis là pour répondre à vos questions sur les produits, la livraison ou vos commandes."
      ]);
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Ajouter le message utilisateur
    setMessages((prev) => [...prev, `Vous: ${input}`]);

    // Générer la réponse IA
    let reply = "Pour plus de détails, appelez le +221 XX XXX XX XX";
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("livraison")) {
      reply =
        "Notre livraison prend 2-3 jours ouvrables. Pour plus d’infos, contactez le +221 XX XXX XX XX";
    } else if (lowerInput.includes("salut") || lowerInput.includes("bonjour")) {
      reply = "Salut ! Comment puis-je vous aider aujourd'hui ?";
    } else if (lowerInput.includes("commande")) {
      reply =
        "Vous pouvez suivre votre commande depuis votre compte ou contactez-nous au +221 XX XXX XX XX";
    }

    // Ajouter la réponse après un petit délai
    setTimeout(() => {
      setMessages((prev) => [...prev, `Yidam IA: ${reply}`]);
    }, 500);

    setInput("");
  };

  return (
    <>
      {/* Icône flottante */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-6 bottom-6 z-50 bg-blue-800 text-white p-4 rounded-full shadow-lg hover:bg-blue-900 transition-all"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Boîte de chat */}
      {open && (
        <div className="fixed right-6 bottom-20 w-80 bg-white border rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
          <div className="bg-blue-800 text-white px-4 py-2 font-semibold flex justify-between items-center">
            Yidam IA
            <button onClick={() => setOpen(false)} className="text-white font-bold">
              ✕
            </button>
          </div>
          <div className="p-2 h-64 overflow-y-auto flex flex-col gap-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg ${
                  msg.startsWith("Vous:") ? "bg-gray-100 self-end" : "bg-blue-100 self-start"
                }`}
              >
                {msg}
              </div>
            ))}
          </div>
          <div className="flex p-2 border-t">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez un message..."
              className="flex-1 border rounded-lg px-2 py-1 mr-2"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              className="bg-blue-800 text-white px-4 py-1 rounded-lg hover:bg-blue-900 transition"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ================== Contenu de l'app ==================
function AppContent() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch({ type: "SET_PRODUCTS", payload: mockProducts });
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <Header />

      {/* Routes */}
      <main>
        <Routes>
          <Route
            path="/"
            element={state.currentView === "customer" ? <HomePage /> : <VendorDashboard />}
          />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </main>

      {/* Boîte IA flottante */}
      {state.currentView === "customer" && <AIChatBox />}
    </div>
  );
}

// ================== App global ==================
export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}
