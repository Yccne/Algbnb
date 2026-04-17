import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Send } from 'lucide-react';

export const PageMessages = () => {
  const navigate = useNavigate();
  const [selectedConv, setSelectedConv] = useState(null);
  const [msgInput, setMsgInput] = useState('');

  const [conversations, setConversations] = useState([
    { 
      id: 1, nom: 'Samia', date: "Aujourd'hui", avatar: "S", unread: true,
      messages: [
        { sender: 'them', text: 'Bonjour ! La villa est-elle disponible pour le 15 juin ?', time: '10:00' }
      ]
    },
    { 
      id: 2, nom: 'Yacine Cherif', date: "Hier", avatar: "Y", unread: true,
      messages: [
        { sender: 'them', text: "Est-il possible d'arriver plus tôt pour le check-in ?", time: 'Hier' }
      ]
    },
    { 
      id: 3, nom: 'Amina B.', date: "Il y a 2 jours", avatar: "A", unread: false,
      messages: [
        { sender: 'me', text: 'Super, n’hésitez pas si vous avez d’autres questions.', time: 'Mar' },
        { sender: 'them', text: "Merci beaucoup pour les conseils sur les restaurants !", time: 'Mar' }
      ]
    },
    { 
      id: 4, nom: 'Khaled O.', date: "La semaine dernière", avatar: "K", unread: false,
      messages: [
        { sender: 'them', text: "Top séjour, merci encore pour tout.", time: 'Lun' }
      ]
    },
  ]);

  const handleSelectConv = (conv) => {
    // Mark as read
    setConversations(conversations.map(c => c.id === conv.id ? { ...c, unread: false } : c));
    setSelectedConv(conv);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    
    const newMsg = { sender: 'me', text: msgInput, time: 'À l\'instant' };
    
    setConversations(conversations.map(c => {
      if (c.id === selectedConv.id) {
        return { ...c, messages: [...c.messages, newMsg] };
      }
      return c;
    }));
    
    setSelectedConv({
      ...selectedConv,
      messages: [...selectedConv.messages, newMsg]
    });
    setMsgInput('');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        
        {!selectedConv ? (
          <>
            <header style={{ marginBottom: 'var(--spacing-12)' }}>
              <h1 style={{ fontSize: 'var(--display-md)', letterSpacing: '-0.02em', marginBottom: 'var(--spacing-4)', lineHeight: 1.1 }}>
                Messages
              </h1>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--headline-md)' }}>
                Vos conversations avec les hôtes et voyageurs.
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {conversations.map((conv) => {
                const lastMessage = conv.messages[conv.messages.length - 1].text;
                return (
                  <div 
                    key={conv.id} 
                    onClick={() => handleSelectConv(conv)}
                    style={{ 
                      display: 'flex', 
                      gap: 'var(--spacing-4)', 
                      padding: 'var(--spacing-6) 0', 
                      borderBottom: '1px solid var(--surface-high)', 
                      cursor: 'pointer',
                      alignItems: 'center',
                      backgroundColor: conv.unread ? 'var(--surface-low)' : 'transparent',
                      padding: 'var(--spacing-4)',
                      borderRadius: 'var(--radius-DEFAULT)',
                      marginBottom: '2px'
                    }}
                  >
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '50%', 
                      backgroundColor: 'var(--primary-container)', color: 'var(--on-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0
                    }}>
                      {conv.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <h4 style={{ fontSize: 'var(--body-md)', fontWeight: conv.unread ? 'bold' : '600' }}>{conv.nom}</h4>
                        <span style={{ fontSize: 'var(--label-sm)', color: 'var(--on-surface-variant)', flexShrink: 0 }}>{conv.date}</span>
                      </div>
                      <p style={{ color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lastMessage}
                      </p>
                    </div>
                    {conv.unread && (
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary)', flexShrink: 0 }}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--surface-high)', marginBottom: 'var(--spacing-4)' }}>
              <button 
                onClick={() => setSelectedConv(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--on-surface-variant)' }}
              >
                <ArrowLeft size={24} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {selectedConv.avatar}
                </div>
                <h3 style={{ fontSize: 'var(--title-lg)', fontWeight: 'bold' }}>{selectedConv.nom}</h3>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', padding: 'var(--spacing-4) 0' }}>
              {selectedConv.messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'me' ? 'var(--primary)' : 'var(--surface-low)',
                  color: msg.sender === 'me' ? 'var(--on-primary)' : 'var(--on-surface)',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-lg)',
                  maxWidth: '80%'
                }}>
                  <p style={{ fontSize: 'var(--body-md)', lineHeight: 1.4 }}>{msg.text}</p>
                  <span style={{ fontSize: '10px', display: 'block', textAlign: 'right', marginTop: '4px', opacity: 0.7 }}>{msg.time}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
              <input 
                type="text" 
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Écrivez un message..." 
                style={{ flex: 1, padding: 'var(--spacing-4)', borderRadius: 'var(--radius-full)', border: '1px solid var(--outline-variant)', fontSize: 'var(--body-md)' }}
              />
              <button type="submit" style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
      </div>

      {!selectedConv && (
        <footer style={{ padding: 'var(--spacing-6) 0', borderTop: '1px solid var(--surface-high)', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 'var(--body-sm)' }}>
          <Link to="#" className="footer-link">Confidentialité</Link>
          <Link to="#" className="footer-link">Conditions</Link>
          <Link to="#" className="footer-link" style={{marginRight: 0}}>Aide</Link>
        </footer>
      )}
      <BottomNavBar />
    </div>
  );
};
