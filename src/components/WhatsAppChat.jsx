import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WhatsAppChat = () => {
  const { t } = useTranslation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');

  //dados reais aqui
  const agentName = "BTWO KEEPERS MANIA";
  const agentPhotoUrl = "https://media-bsb1-1.cdn.whatsapp.net/v/t61.24694-24/510802218_758568533498935_635495657118359847_n.jpg?ccb=11-4&oh=01_Q5Aa2gFtZxhOf_fizFZuhQ3HaVKx_MB4gx_XPifVJ3B-EXdBpw&oe=68CC4998&_nc_sid=5e03e0&_nc_cat=109"; // Substitua pela sua URL
  const phoneNumber = "+447497239237"; 

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;

    // Constrói o link do WhatsApp com a mensagem
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Abre a conversa em uma nova aba
    window.open(whatsappUrl, '_blank');
    
    // Fecha o chat e limpa a mensagem
    setIsChatOpen(false);
    setMessage('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botão flutuante para abrir o chat */}
      <motion.button
        onClick={() => setIsChatOpen(!isChatOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "loop",
        }}
        className="w-16 h-16 rounded-full bg-[#eab308] text-white shadow-lg flex items-center justify-center cursor-pointer"
      >
        <img src="/icons/whatsapp.png" alt="WhatsApp" className="w-8 h-8" />
      </motion.button>

      {/* Animação de entrada e saída do chat */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed bottom-24 right-6 w-80 h-[450px] bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Cabeçalho do Chat */}
            <div className="bg-green-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={agentPhotoUrl} alt={agentName} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="font-semibold text-white">{agentName}</h4>
                  <p className="text-xs text-green-200">{t('whatsapp.online')}</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Chat com Mensagens de Exemplo */}
            <div className="p-4 flex-grow overflow-y-auto space-y-4">
              <div className="bg-gray-800 p-3 rounded-xl max-w-[75%]">
                <p className="text-white text-sm">{t('whatsapp.greeting')}</p>
              </div>
              <div className="bg-gray-800 p-3 rounded-xl max-w-[75%]">
                <p className="text-white text-sm">{t('whatsapp.askHelp')}</p>
              </div>
            </div>

            {/* Formulário de Mensagem */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-gray-900 flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('whatsapp.placeholder')}
                className="flex-grow bg-transparent text-white text-sm placeholder:text-gray-500 focus:outline-none"
              />
              <motion.button 
                type="submit"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-[#eab308] text-white ml-2 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WhatsAppChat;