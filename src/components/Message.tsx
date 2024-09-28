// src/components/Message.tsx
import React, { useState } from 'react';

const Message = ({ message, messages, onAddBranch, onDeleteMessage }) => {
  const [branchContent, setBranchContent] = useState('');
  const [isBranching, setIsBranching] = useState(false);

  const childMessages = messages.filter(
    (msg) => msg.parent_message_id === message.id
  );

  const handleAddBranch = () => {
    if (branchContent.trim() !== '') {
      onAddBranch(message.id, branchContent);
      setBranchContent('');
      setIsBranching(false);
    }
  };

  const handleDelete = () => {
    onDeleteMessage(message.id); // Call the delete function from props
  };

  return (
    <div style={{ marginLeft: '20px', marginTop: '10px', border: '1px solid gray', padding: '10px' }}>
      <p>{message.content}</p>
      <button onClick={() => setIsBranching(!isBranching)}>
        {isBranching ? 'Cancel' : 'Add Branch'}
      </button>
      <button onClick={handleDelete}>Delete</button> {/* Delete button */}

      {isBranching && (
        <div>
          <input
            type="text"
            value={branchContent}
            onChange={(e) => setBranchContent(e.target.value)}
            placeholder="Branch content"
          />
          <button onClick={handleAddBranch}>Save</button>
        </div>
      )}

      {childMessages.map((child) => (
        <Message
          key={child.id}
          message={child}
          messages={messages}
          onAddBranch={onAddBranch}
          onDeleteMessage={onDeleteMessage} // Pass delete function
        />
      ))}
    </div>
  );
};

export default Message;
