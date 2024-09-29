"use client";
// src/components/ChatBox.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Message from './Message';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // State for success message

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

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [successMessage]);

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
    try {
      // Fetch the latest version for the given parent message
      const { data: versions, error: fetchError } = await supabase
        .from('message_versions')
        .select('version')
        .eq('message_id', parentId)
        .order('version', { ascending: false })
        .limit(1); // Get the latest version
  
      if (fetchError) {
        console.error('Error fetching versions:', fetchError.message);
        return;
      }
  
      // Determine the next version number
      const latestVersion = versions.length > 0 ? versions[0].version : 0;
      const newVersion = latestVersion + 1;
  
      // Insert the new branch
      const { error: insertError } = await supabase
        .from('messages')
        .insert([{ content, parent_message_id: parentId }]);
  
      if (insertError) {
        console.error('Error adding branch:', insertError.message);
        return;
      }
  
      // Insert the new version with incremented version number
      const { error: versionError } = await supabase
        .from('message_versions')
        .insert([{ message_id: parentId, content, version: newVersion }]);
  
      if (versionError) {
        console.error('Error adding to message history:', versionError.message);
      } else {
        console.log(`New version added: Version ${newVersion}`);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error.message);
    }
  };
  

  const deleteMessage = async (id) => {
    try {
      // First, delete all associated message versions
      const { error: versionError } = await supabase
        .from('message_versions')
        .delete()
        .eq('message_id', id);

      if (versionError) {
        console.error('Error deleting message versions:', versionError.message);
        return;
      }

      // Then delete the message itself
      const { error: messageError } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (messageError) {
        console.error('Error deleting message:', messageError.message);
      } else {
        // Update the success message state when delete is successful
        setSuccessMessage('Message and associated versions deleted successfully');
        console.log('Message and associated versions deleted successfully.');
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error.message);
    }
  };

  return (
    <div>
      <div>
        {/* Show success message */}
        {successMessage && (
          <div style={{ color: 'green', marginBottom: '10px' }}>
            {successMessage}
          </div>
        )}
        {/* Messages */}
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
