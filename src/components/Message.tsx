import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Message.css'; // Add CSS for styling

const Message = ({ message, messages, onAddBranch, onDeleteMessage, onEditMessage }) => {
  const [branchContent, setBranchContent] = useState('');
  const [isBranching, setIsBranching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content); // Store edit content

  const childMessages = messages.filter(
    (msg) => msg.parent_message_id === message.id
  );

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('message_versions')
      .select('*')
      .eq('message_id', message.id)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching message history:', error.message);
    } else {
      setHistory(data);
    }
  };

  const handleViewHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      fetchHistory();
    }
  };

  const handleAddBranch = () => {
    if (branchContent.trim() !== '') {
      onAddBranch(message.id, branchContent);
      setBranchContent('');
      setIsBranching(false);
    }
  };

  // Function to handle editing
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEditMessage(message.id, editContent);
    setIsEditing(false);
  };

  return (
    <div className="message-box">
      <div className="message-header">
        {isEditing ? (
          <div>
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit message"
            />
            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        ) : (
          <p>{message.content}</p>
        )}
        <div className="message-actions">
          {isEditing ? (
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          ) : (
            <>
               <button onClick={() => setIsBranching(!isBranching)}>
            {isBranching ? 'Cancel' : 'Add Branch'}
          </button>
          <button onClick={handleViewHistory}>
            {showHistory ? 'Hide History' : 'View History'}
          </button>
              <button onClick={handleEdit}>Edit</button>

              
              <button onClick={() => onDeleteMessage(message.id)}>Delete</button>
            </>
          )}
        </div>
      </div>

      {isBranching && (
        <div className="branch-input-container">
          <input
            type="text"
            className="branch-input"
            value={branchContent}
            onChange={(e) => setBranchContent(e.target.value)}
            placeholder="Branch content"
          />
          <button className="save-branch-button" onClick={handleAddBranch}>
            Save
          </button>
        </div>
      )}

      {showHistory && (
        <div className="history-container">
        <h4>Message History:</h4>
        {history.map((version) => (
          <div key={version.id} className="history-item">
            <p>Version {version.version}: {version.content}</p>
            <small>Created at: {new Date(version.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
      
      )}

      {childMessages.map((child) => (
        <Message
          key={child.id}
          message={child}
          messages={messages}
          onAddBranch={onAddBranch}
          onDeleteMessage={onDeleteMessage}
          onEditMessage={onEditMessage} // Pass edit function
        />
      ))}
    </div>
  );
};

export default Message;
