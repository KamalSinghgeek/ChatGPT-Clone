import React from 'react';

const Message = ({ message }) => {
  return (
    <div className="message">
      <p>{message.content}</p>
    </div>
  );
};

export default Message;
