import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';
import { getChatHistory, saveChatHistory } from '../utils/storage';
import { Send, Sparkles, Trash2, Bot, User } from 'lucide-react';

const SUGGESTIONS = [
  "How many more grams of protein do I need today?",
  "Suggest a vegetarian dinner under 500 calories",
  "What high-protein veg snack can I have?",
  "Build me a 4-week plan to run a 5k",
  "Am I on track with my goals today?",
  "Suggest a post-workout meal from an Indian pantry",
];

export default function Coach() {
  const { profile, targets, totalCaloriesIn, totalCaloriesOut, totalProtein, totalCarbs, totalFats, foods, activities } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(getChatHistory());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function generateResponse(userMsg: string): string {
    const remaining = targets.calories - totalCaloriesIn + totalCaloriesOut;
    const proteinLeft = targets.protein - totalProtein;
    const lower = userMsg.toLowerCase();

    if (lower.includes('protein') && (lower.includes('need') || lower.includes('how many') || lower.includes('left'))) {
      if (proteinLeft > 0) {
        return `You've had ${totalProtein}g of protein so far today. You need about ${proteinLeft}g more to hit your target of ${targets.protein}g.\n\nHere are some high-protein vegetarian options:\n• Paneer (100g) — 18g protein\n• Tofu stir fry — 14g protein\n• Lentil soup (dal) — 9g protein per bowl\n• Greek yogurt — 10g protein\n• Sprouts salad — 8g protein per bowl\n\nA paneer tikka with a bowl of sprouts would get you close! 💪`;
      }
      return `Great news! You've already hit ${totalProtein}g of protein today, which meets your target of ${targets.protein}g. Keep it up! 🎉`;
    }
    if (lower.includes('snack') || lower.includes('hungry')) {
      return `With ${remaining} calories remaining today, here are some smart snack options:\n\n🥜 Roasted Makhana (1 cup) — 90 cal, 3g protein\n🧀 Paneer cubes (50g) — 130 cal, 9g protein\n🥗 Sprouts chaat — 100 cal, 8g protein\n🍌 Banana with peanut butter — 200 cal, 5g protein\n🥛 Buttermilk (chaas) — 40 cal, 2g protein\n\nI'd recommend the makhana or sprouts if you want to stay light!`;
    }
    if (lower.includes('dinner') || (lower.includes('suggest') && lower.includes('meal'))) {
      return `Based on your remaining ${remaining} calories, here's a balanced vegetarian dinner idea:\n\n🍽️ Suggested Dinner (~450 cal)\n• 1 bowl Palak Paneer — 280 cal, 14g protein\n• 2 Rotis — 140 cal, 5g protein\n• 1 bowl Raita — 70 cal, 3g protein\n• Green Salad — 20 cal\n\nTotal: ~510 cal | 22g protein\n\nThis gives you a good mix of protein from paneer and probiotics from raita. Want me to adjust portions?`;
    }
    if (lower.includes('track') || lower.includes('on track') || lower.includes('progress') || lower.includes('today')) {
      const status = remaining > 0 ? 'on track' : 'over your target';
      return `Here's your day so far:\n\n📊 Calories: ${totalCaloriesIn} eaten / ${targets.calories} target (${remaining} remaining)\n💪 Protein: ${totalProtein}g / ${targets.protein}g\n🍞 Carbs: ${totalCarbs}g / ${targets.carbs}g\n🧈 Fats: ${totalFats}g / ${targets.fats}g\n🔥 Burned: ${totalCaloriesOut} cal from ${activities.length} workout(s)\n🍽️ Meals logged: ${foods.length}\n\nYou're ${status}! ${remaining > 500 ? "Don't forget to eat enough — skipping meals isn't great for your metabolism." : remaining > 0 ? "Looking good, keep it up!" : "Consider a lighter dinner or a quick walk to balance things out."}`;
    }
    if (lower.includes('plan') || lower.includes('5k') || lower.includes('week')) {
      return `Here's a 4-week beginner-friendly 5K plan that preserves muscle:\n\n📅 Week 1-2: Base Building\n• Mon/Wed/Fri: 20 min jog-walk intervals (2 min jog, 1 min walk)\n• Tue/Thu: 30 min strength training (bodyweight + resistance bands)\n• Sat: 30 min easy walk\n• Sun: Rest\n\n📅 Week 3-4: Build Endurance\n• Mon/Wed/Fri: 25-30 min continuous jogging\n• Tue/Thu: 30 min strength + 10 min core\n• Sat: Long run — 35-40 min easy pace\n• Sun: Active recovery (yoga/stretching)\n\n🥗 Nutrition Tips:\n• Eat 300-400 cal 2 hours before runs\n• Post-run: protein shake or paneer wrap within 30 min\n• Stay hydrated — aim for 3L water daily\n\nWant me to customize this based on your current fitness level?`;
    }
    return `I'm your NutriTrack AI coach! Here's what I can help with:\n\n• Track your daily nutrition progress\n• Suggest meals based on your remaining calories\n• Recommend high-protein vegetarian options\n• Create workout and running plans\n• Analyze your eating patterns\n\nYou've consumed ${totalCaloriesIn} cal today with ${remaining} remaining. What would you like to know?`;
  }

  async function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: msg, timestamp: new Date().toISOString() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
    const response: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: generateResponse(msg), timestamp: new Date().toISOString() };
    const final = [...updated, response];
    setMessages(final);
    saveChatHistory(final);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen lg:h-[calc(100vh-0px)]">
      {/* Header */}
      <div className="bg-white p-4 lg:px-8 border-b border-gray-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">NutriTrack Coach</h1>
            <p className="text-xs text-gray-400">AI-powered fitness & nutrition advice</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); saveChatHistory([]); }}
            className="text-gray-300 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-50">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 lg:px-8 lg:py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles size={32} className="text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Hi{profile?.name ? `, ${profile.name}` : ''}!</h2>
              <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">I'm your AI fitness coach. Ask me anything about nutrition, workouts, or meal planning.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-w-xl mx-auto">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => handleSend(s)}
                    className="text-left text-sm bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-600 hover:border-brand-300 hover:bg-brand-50 transition-all hover:shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center shrink-0 mt-1">
                  <Bot size={16} className="text-brand-600" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-md'
                  : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center shrink-0 mt-1">
                  <User size={16} className="text-gray-500" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                <Bot size={16} className="text-brand-600" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm rounded-bl-md">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4 lg:px-8 shrink-0">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask your coach anything..."
            className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all" />
          <button onClick={() => handleSend()} disabled={!input.trim() || loading}
            className="bg-brand-600 text-white px-5 py-3 rounded-xl disabled:opacity-40 hover:bg-brand-700 transition-all shadow-sm hover:shadow-md">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
