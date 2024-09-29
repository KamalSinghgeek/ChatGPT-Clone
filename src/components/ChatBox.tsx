"use client";
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

      const latestVersion = versions.length > 0 ? versions[0].version : 0;
      const newVersion = latestVersion + 1;

      const { error: insertError } = await supabase
        .from('messages')
        .insert([{ content, parent_message_id: parentId }]);

      if (insertError) {
        console.error('Error adding branch:', insertError.message);
        return;
      }

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
      const { error: versionError } = await supabase
        .from('message_versions')
        .delete()
        .eq('message_id', id);

      if (versionError) {
        console.error('Error deleting message versions:', versionError.message);
        return;
      }

      const { error: messageError } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (messageError) {
        console.error('Error deleting message:', messageError.message);
      } else {
        setSuccessMessage('Message and associated versions deleted successfully');
        console.log('Message and associated versions deleted successfully.');
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error.message);
    }
  };

  // New function to edit a message
  const editMessage = async (id, newContent) => {
    try {
      const { data: existingMessage, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id);

      if (fetchError) {
        console.error('Error fetching existing message:', fetchError.message);
        return;
      }

      if (existingMessage.length > 0) {
        const currentContent = existingMessage[0].content;
        const currentVersion = existingMessage[0].version || 1;

        // Insert the current message as a version before updating
        const { error: versionError } = await supabase
          .from('message_versions')
          .insert([{ message_id: id, content: currentContent, version: currentVersion }]);

        if (versionError) {
          console.error('Error inserting message version:', versionError.message);
        }

        // Update the original message content
        const { error: updateError } = await supabase
          .from('messages')
          .update({ content: newContent, version: currentVersion + 1 })
          .eq('id', id);

        if (updateError) {
          console.error('Error updating message:', updateError.message);
        } else {
          console.log('Message updated successfully');
        }
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error.message);
    }
  };

  return (
    <div>
      <div>
        {successMessage && (
          <div style={{ color: 'green', marginBottom: '10px' }}>
            {successMessage}
          </div>
        )}
        {messages
          .filter((msg) => msg.parent_message_id === null)
          .map((message) => (
            <Message
              key={message.id}
              message={message}
              messages={messages}
              onAddBranch={addBranch}
              onDeleteMessage={deleteMessage} // Pass delete function
              onEditMessage={editMessage} // Pass edit function
            />
          ))}
      </div>
      <div className="input-container">
  <textarea
    className="custom-textarea"
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
  />
  <button className="main-button" onClick={sendMessage}>Send</button>
</div>
    </div>
  );
};

export default ChatBox;
