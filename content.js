// Define a function to create the chat window
function createChatWindow() {
    const chatWindow = document.createElement('div');
    chatWindow.style.position = 'fixed';
    chatWindow.style.bottom = '0px';
    chatWindow.style.right = '0px';
    chatWindow.style.width = '300px';
    chatWindow.style.height = '400px';
    chatWindow.style.backgroundColor = '#ffffff';
    chatWindow.style.border = '1px solid #000000';
    chatWindow.style.padding = '10px';
    chatWindow.style.overflow = 'auto';
    chatWindow.style.zIndex = '1000';

    // Create chat log
    const chatLog = document.createElement('div');
    chatLog.id = 'chat-log';
    chatWindow.appendChild(chatLog);

    // Create input area
    const inputArea = document.createElement('div');
    const chatInput = document.createElement('input');
    chatInput.id = 'chat-input';
    chatInput.type = 'text';
    chatInput.style.width = '80%';
    inputArea.appendChild(chatInput);
    const sendButton = document.createElement('button');
    sendButton.id = 'send-button';
    sendButton.innerText = 'Send';
    inputArea.appendChild(sendButton);

    chatWindow.appendChild(inputArea);

    // Add chat window to body
    document.body.appendChild(chatWindow);

    // Send message when button is clicked
    sendButton.addEventListener('click', function() {
        const userInput = chatInput.value;
        chatInput.value = '';
        const chatLog = document.getElementById('chat-log');

        const messageDiv = document.createElement('div');
        messageDiv.innerText = "Message: " + userInput;
        chatLog.appendChild(messageDiv);

        sendMessageToBackground(userInput);
    });
}

// Define a function to send a message to the background script
function sendMessageToBackground(message) {
    chrome.runtime.sendMessage({userInput: message}, function(response) {
        // Add the response to the chat log
        const chatLog = document.getElementById('chat-log');


        const responseDiv = document.createElement('div');
        responseDiv.innerText = "Event OnChange: " + JSON.stringify(response);
        chatLog.appendChild(responseDiv);


    });
}

// Create the chat window when the content script is injected
createChatWindow();
