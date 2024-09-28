"use client";
// src/components/ChatBox.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Message from './Message';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch messages on mount and on updates
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      setMessages(data);
    };

    fetchMessages();

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchMessages(); // Refresh messages when there’s a change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription); // Clean up subscription on unmount
    };
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const { data, error } = await supabase
      .from('messages')
      .insert([{ content: newMessage, parent_message_id: null }]);

    if (error) {
      console.error('Error inserting message:', error.message);
    } else {
      setNewMessage(''); // Clear the input field after sending
    }
  };

  const addBranch = async (parentId, content) => {
    const { error } = await supabase
      .from('messages')
      .insert([{ content, parent_message_id: parentId }]);

    if (error) {
      console.error('Error adding branch:', error.message);
    }
  };

  const deleteMessage = async (id) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting message:', error.message);
    }
  };

  return (
    <div>
      <div>
        {messages
          .filter((msg) => msg.parent_message_id === null)
          .map((message) => (
            <Message
              key={message.id}
              message={message}
              messages={messages}
              onAddBranch={addBranch}
              onDeleteMessage={deleteMessage} // Pass delete function
            />
          ))}
      </div>
      <textarea
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatBox;
