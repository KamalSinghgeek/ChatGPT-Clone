import React from "react";
import Message from "./Message";

const BranchMessage = ({ message, messages }) => {
  const childMessages = messages.filter(
    (msg) => msg.parent_message_id === message.id
  );

  return (
    <div>
      {childMessages.map((child) => (
        <Message
          key={child.id}
          message={child}
          messages={messages}
          onUpdate={() => {}}
          onAddBranch={() => {}}
        />
      ))}
    </div>
  );
};

export default BranchMessage;
