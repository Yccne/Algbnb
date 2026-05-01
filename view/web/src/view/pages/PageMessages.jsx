import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Send } from 'lucide-react';
import { messagesController } from '@algbnb/controller-client';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { BottomNavBar } from '../components/BottomNavBar';

export const PageMessages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const requestedConversationId = location.state?.conversationId;
  const fromLogementId = location.state?.fromLogementId;
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    const data = await messagesController.getConversations();
    setConversations(data);
    return data;
  }, []);

  const loadMessages = useCallback(async (conversation) => {
    const data = await messagesController.getConversationMessages(conversation.conversation_id);
    setMessages(data);
  }, []);

  const selectConversation = useCallback(async (conversation) => {
    setSelectedConv(conversation);
    setError('');
    await loadMessages(conversation);
    setConversations((current) =>
      current.map((item) =>
        item.conversation_id === conversation.conversation_id ? { ...item, nb_non_lus: 0 } : item
      )
    );
  }, [loadMessages]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await loadConversations();
        if (!active) {
          return;
        }

        if (requestedConversationId) {
          const requestedConversation = data.find(
            (item) => String(item.conversation_id) === String(requestedConversationId)
          );
          if (requestedConversation) {
            await selectConversation(requestedConversation);
          }
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [user, requestedConversationId, loadConversations, selectConversation]);

  useEffect(() => {
    if (!selectedConv || !user) {
      return undefined;
    }

    const interval = setInterval(() => {
      loadMessages(selectedConv).catch(() => {});
      loadConversations().catch(() => {});
    }, 8000);

    return () => clearInterval(interval);
  }, [selectedConv, user, loadMessages, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!msgInput.trim() || !selectedConv) {
      return;
    }

    setError('');
    try {
      await messagesController.sendMessage(selectedConv.conversation_id, msgInput.trim());
      setMsgInput('');
      await selectConversation(selectedConv);
      await loadConversations();
    } catch (sendError) {
      setError(sendError.message);
    }
  };

  const handlePhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConv) {
      return;
    }

    setSendingPhoto(true);
    setError('');
    try {
      await messagesController.sendPhotoMessage(selectedConv.conversation_id, file, msgInput.trim());
      setMsgInput('');
      event.target.value = '';
      await selectConversation(selectedConv);
      await loadConversations();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setSendingPhoto(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-main)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />
      <div className="page-container" style={{ flex: 1, marginTop: 'var(--spacing-16)' }}>
        {!user ? (
          <div
            style={{
              padding: 'var(--spacing-10)',
              backgroundColor: 'var(--surface-low)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            Connecte-toi pour acceder a la messagerie.
          </div>
        ) : loading ? (
          <div className="spinner"></div>
        ) : !selectedConv ? (
          <>
            <header style={{ marginBottom: 'var(--spacing-12)' }}>
              <h1
                style={{
                  fontSize: 'var(--display-md)',
                  letterSpacing: '-0.02em',
                  marginBottom: 'var(--spacing-4)',
                  lineHeight: 1.1,
                }}
              >
                Messages
              </h1>
              <p
                style={{
                  color: 'var(--on-surface-variant)',
                  fontSize: 'var(--headline-md)',
                }}
              >
                Chat entre voyageurs et hotes avec texte, photos et notifications.
              </p>
            </header>

            {error ? (
              <div
                style={{
                  marginBottom: 'var(--spacing-6)',
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'rgba(180, 35, 24, 0.08)',
                  color: 'var(--error)',
                  borderRadius: 'var(--radius-DEFAULT)',
                }}
              >
                {error}
              </div>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversation_id}
                  onClick={() => selectConversation(conversation)}
                  style={{
                    display: 'flex',
                    gap: 'var(--spacing-4)',
                    padding: 'var(--spacing-4)',
                    borderBottom: '1px solid var(--surface-high)',
                    cursor: 'pointer',
                    alignItems: 'center',
                    backgroundColor:
                      Number(conversation.nb_non_lus) > 0 ? 'var(--surface-low)' : 'transparent',
                    borderRadius: 'var(--radius-DEFAULT)',
                    marginBottom: '2px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-container)',
                      color: 'var(--on-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    {(conversation.interlocuteur_prenom || conversation.interlocuteur_nom || 'U').charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: 'var(--body-md)',
                          fontWeight: Number(conversation.nb_non_lus) > 0 ? 'bold' : '600',
                        }}
                      >
                        {conversation.interlocuteur_prenom} {conversation.interlocuteur_nom}
                      </h4>
                      <span
                        style={{
                          fontSize: 'var(--label-sm)',
                          color: 'var(--on-surface-variant)',
                          flexShrink: 0,
                        }}
                      >
                        {conversation.dernier_message_date?.slice(0, 10) || ''}
                      </span>
                    </div>
                    <p
                      style={{
                        color: 'var(--on-surface-variant)',
                        fontSize: 'var(--body-sm)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conversation.dernier_message ||
                        (conversation.derniere_photo ? 'Photo envoyee' : 'Aucun message')}
                    </p>
                  </div>
                </div>
              ))}

              {conversations.length === 0 ? (
                <p style={{ color: 'var(--on-surface-variant)' }}>
                  Aucune conversation pour le moment.
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-4)',
                paddingBottom: 'var(--spacing-4)',
                borderBottom: '1px solid var(--surface-high)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <button
                onClick={() => { if (fromLogementId) { navigate('/logement/' + fromLogementId); } else { setSelectedConv(null); } }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--on-surface-variant)',
                }}
              >
                <ArrowLeft size={24} />
              </button>
              <h3 style={{ fontSize: 'var(--title-lg)', fontWeight: 'bold' }}>
                {selectedConv.interlocuteur_prenom} {selectedConv.interlocuteur_nom}
              </h3>
            </div>

            {error ? (
              <div
                style={{
                  marginBottom: 'var(--spacing-4)',
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'rgba(180, 35, 24, 0.08)',
                  color: 'var(--error)',
                  borderRadius: 'var(--radius-DEFAULT)',
                }}
              >
                {error}
              </div>
            ) : null}

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-4)',
                padding: 'var(--spacing-4) 0',
              }}
            >
              {messages.map((message) => {
                const isMe = String(message.id_expediteur) === String(user.id);
                return (
                  <div
                    key={message.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      backgroundColor: isMe ? 'var(--primary)' : 'var(--surface-low)',
                      color: isMe ? 'var(--on-primary)' : 'var(--on-surface)',
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      borderRadius: 'var(--radius-lg)',
                      maxWidth: '80%',
                    }}
                  >
                    {message.photo_url ? (
                      <img
                        src={message.photo_url}
                        alt="Photo message"
                        style={{
                          width: '220px',
                          maxWidth: '100%',
                          borderRadius: '16px',
                          marginBottom: message.contenu ? '10px' : 0,
                        }}
                      />
                    ) : null}
                    {message.contenu ? (
                      <p style={{ fontSize: 'var(--body-md)', lineHeight: 1.4 }}>{message.contenu}</p>
                    ) : null}
                    <span
                      style={{
                        fontSize: '10px',
                        display: 'block',
                        textAlign: 'right',
                        marginTop: '4px',
                        opacity: 0.7,
                      }}
                    >
                      {message.date_envoi?.slice(11, 16)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              style={{
                display: 'flex',
                gap: 'var(--spacing-2)',
                marginTop: 'var(--spacing-4)',
                alignItems: 'center',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoSelected}
              />
              <button
                type="button"
                className="btn-outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendingPhoto}
                style={{
                  width: '48px',
                  height: '48px',
                  padding: 0,
                  borderRadius: '999px',
                  justifyContent: 'center',
                }}
              >
                <ImagePlus size={18} />
              </button>
              <input
                value={msgInput}
                onChange={(event) => setMsgInput(event.target.value)}
                placeholder="Ecrivez un message..."
                style={{
                  flex: 1,
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--outline-variant)',
                  fontSize: 'var(--body-md)',
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--on-primary)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
};



