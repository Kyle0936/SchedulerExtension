// Fill in your own Google Console's OAuth2
const YOUR_CLIENT_ID=""
const YOUR_CLIENT_SECRET=""

// Function to call the GPT-4 API
function callGptApi(userMessage) {
    // Append a line to the user's message to guide the GPT-4 output format
    let now = new Date();
    let date = now.toISOString().split('T')[0];
    let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    

    const prompt = 'Generate ONLY a json object containing a list of json objects representing a list of events for Google Calendar API in the response. Here is an example of a JSON schema {"actions":[{"action":"add","event":{"summary":"","location":"","description":"","start":{"dateTime":"yyyy-MM-ddThh:mm:ss","timeZone":""},"end":{"dateTime":"yyyy-MM-ddThh:mm:ss","timeZone":""},"recurrence":["RRULE:FREQ=DAILY;COUNT=2"],"attendees":[{"email":""},{"email":""}],"reminders":{"useDefault":false,"overrides":[{"method":"popup","minutes":10}]}}},{"action":"remove","event":{"summary":""}},{"action":"update","eventid":"","event":{"summary":"","location":"","description":"","start":{"dateTime":"yyyy-MM-ddThh:mm:ss","timeZone":""},"end":{"dateTime":"yyyy-MM-ddThh:mm:ss","timeZone":""},"recurrence":["RRULE:FREQ=DAILY;COUNT=2"],"attendees":[{"email":""},{"email":""}],"reminders":{"useDefault":false,"overrides":[{"method":"popup","minutes":10}]}}}]}. Use the following description and the todo list with given deadlines to decide if a series of events should be add, remove, or update to help me schedule my calendar with today as '+ date + ' in timezone ' + timeZone+'. If there are fields not mention, skip them in the json fields. If no attenddee emails are mentioned, skip the field attendees as well. Assume the tasks are in low priority if no deadlines or times are mentioned. You can fill in blanks in the preivously provided structured JSON schema but make sure they work for Google Calendar API: ' + userMessage;

    return fetch('http://FILLINYOURCHATGPT4HOST/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{
                role: 'user',
                content: prompt
            }]
        })
    }).then(response => response.json());
}

function getAuthToken() {
    return new Promise((resolve, reject) => {
        let authUrl = 'https://accounts.google.com/o/oauth2/v2/auth' +
            '?client_id=' + YOUR_CLIENT_ID +
            '&response_type=code' +
            '&scope=' + encodeURIComponent('https://www.googleapis.com/auth/calendar') +
            '&redirect_uri=' + encodeURIComponent(chrome.identity.getRedirectURL()) +
            '&access_type=offline';

        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, redirectUrl => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                let url = new URL(redirectUrl);
                let code = url.searchParams.get('code');
                
                let tokenUrl = 'https://oauth2.googleapis.com/token';
                let body = new URLSearchParams();
                body.append('code', code);
                body.append('client_id', YOUR_CLIENT_ID);
                body.append('client_secret', YOUR_CLIENT_SECRET);
                body.append('redirect_uri', chrome.identity.getRedirectURL());
                body.append('grant_type', 'authorization_code');

                fetch(tokenUrl, {
                    method: 'POST',
                    body: body
                }).then(response => response.json())
                .then(data => {
                    // You now have an access token
                    console.log(data.access_token)
                    resolve(data.access_token);
                });
            }
        });
    });
}

async function performCalendarAction(events, token) {
    console.log(events);
    for(let i = 0; i < events.length; i++) {
        let event = events[i];
        let url;
        let method;
        let body;

        await new Promise(resolve => setTimeout(resolve, 500));  // 0.5 sec pause

        switch(event.action) {
            case "add":
                url = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
                method = "POST";
                body = JSON.stringify(event.event);
                break;
            // TODO:
            // case "remove":
            //     url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.event.id}`;
            //     method = "DELETE";
            //     break;
            // case "update":
            //     url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.event.id}`;
            //     method = "PUT";
            //     body = JSON.stringify(event.event);
            //     break;
        }

        fetch(url, {
            method: method,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: body
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch((error) => {
          console.error('Error:', error);
        });
    }
}


// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Get the user's message from the request
    const userMessage = request.userInput;

    // Call the GPT-4 API with the user's message
    callGptApi(userMessage).then(gptResponse => {
        // Interpret the GPT-4 output
        console.log(gptResponse)
        const tmp = JSON.parse(gptResponse.choices[0].message.content);
        const events = tmp.actions;
        console.log(events);

        if (!events) {
            // If the GPT-4 output couldn't be interpreted, return an error message
            sendResponse({error: 'Could not interpret GPT-4 output.'});
            return;
        }

        // Get an OAuth2 token
        getAuthToken().then(token => {
            // Perform the calendar action
            performCalendarAction(events, token);

            // Send a response back to the content script
            sendResponse({response: "Updated " + events.length + " events in your calendar"});
        }).catch(error => {
            // If there was an error getting the token, return an error message
            sendResponse({error: 'Error getting OAuth2 token: ' + error});
        });
    }).catch(error => {
        // If there was an error calling the GPT-4 API, return an error message
        sendResponse({error: 'Error calling GPT-4 API: ' + error});
    });

    // This line is necessary to use sendResponse asynchronously
    return true;
});


// for test:
// Schedule and prioritize todo items for me. For this week, I sleep before 11 PM and wake up after 9 AM. I will have dinner with a@uaaaa.edu tonight from 7 to 8 PM. I have the following todo list: 1. The deadline of Assignment 1 is today at 10 PM and it takes me 30 mins to finish. 2. Assignment2 due next week but it takes me 5 days to finish.