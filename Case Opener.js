/*
-------------------------------------------------------------------------------------------------------------------------
In this piece of code, I have taken 'Case test latest' and reformatted it so the code looks cleaner (e.g. indents, comments, 
deleting unnecessary code). 

- Have also managed to fix what I broke on Friday - so now we are able to push the array 'output' to webex teams. 

- Have also renamed the 'push' function as 'postToTeams' since it was confusing to use push for both posting to teams and 
  appending information to the 'output' array.
  
- Have added output = []; to refresh the output array each time 'Open Case' widget is pressed

- Have added 'successful/unsucessful' alert depending on if message is successfully posted to Teams

- Have added placeholder for each input box
  

NEXT STEPS: 
1. Can we present the array in a more user-friendly format, e.g. newlines in between each bit of information, but still
  posting only a single message per issue?

2. WPR/Tech/Room support can now join these rooms and we have a functional solution. BUT can we instead get this information
  stored in a database that they can access? That way more details can be assigned as the case is developed, such as adding a
  case number/an assigned member of staff that has taken ownership of a specific issue/any updates on situation.
-------------------------------------------------------------------------------------------------------------------------
*/

const xapi = require('xapi');


// Make sure to do this before running (from CLI by SSH):
//        - xConfiguration HttpClient Mode: On
//        - xConfiguration HttpClient AllowInsecureHTTPS: True


// Create system info variables 
var systemInfo = {
    systemName: ''
  , softwareVersion: ''
  , softwareReleaseDate: ''
  , SystemSerialNumber: ''
  , SystemProductId: ''
  , SystemProductType: ''
  , SystemProductPratform: ''
  , IpAddress: ''
};

// roomId will store the appropriate Webex Teams room id that the report should be sent to
let roomId = null;

// create array for webex teams output
var output = [];
console.log("output is " + JSON.stringify(output)); //print statement for testing purposes





//------------------------------------------------------------------------------------
//                      Function to post message to WebEx Teams
//-------------------------------------------------------------------------------------

function postToTeams(msg, cb) {

    // token id of the Case Opener Bot - sender of messages 
    const token = "MWIyYWRiYTItYzQ2Zi00OTUwLWI2MTMtYTZkOTNjNzJiYzk2OGZjNmY5NWQtNGE3_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f";

    let payload = {
        "markdown": msg,
        "roomId": roomId
    };

    xapi.command(
        'HttpClient Post', {
            Header: ["Content-Type: application/json", "Authorization: Bearer " + token],
            Url: "https://api.ciscospark.com/v1/messages",
            AllowInsecureHTTPS: "True"
        },
        
        JSON.stringify(payload)
    )
    .then((response) => {
        
        // Checks if message was posted to teams successfully and if not, it finds out the type of error and prints it  
        if (response.StatusCode == 200) {
          xapi.command('UserInterface Message Alert Display', {
            Duration: 5,
            Text: 'Thank you for your feedback, your query has been submitted to the relevant team.',
            Title: 'Case opened'
          });  
          
            console.log("message pushed to Webex Teams");
            if (cb) cb(null, response.StatusCode);
            return;
        }
        else {
          xapi.command('UserInterface Message Alert Display', {
            Duration: 5,
            Text: 'Sorry, there was an issue with submitting your response. Please try again, if the issue persists, please visit helpzone.cisco.com.',
            Title: 'Unsuccessful'
          });            
            console.log("failed with status code: " + response.StatusCode);
        }
        if (cb) cb("failed with status code: " + response.StatusCode, response.StatusCode);
    })
    .catch((err) => {
          xapi.command('UserInterface Message Alert Display', {
            Duration: 5,
            Text: 'Sorry, there was an issue with submitting your response. Please try again, if the issue persists, please visit helpzone.cisco.com.',
            Title: 'Unsuccessful'
          });           
        console.log("failed with err: " + err.message);
        if (cb) cb("Could not post message to Webex Teams");
    });
}





// ------------------------------------------------------------------------------------
//             Display appropriate options when 'Open Case' is clicked on
//-------------------------------------------------------------------------------------

xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    if (event.PanelId === 'case') {
      output = []; // refresh array each time widget is pressed
      xapi.command('UserInterface Message Prompt Display', { 
        Title: "Request Support",
        Text: 'Please select what support type is required:',
        FeedbackId: 'support_type',
        'Option.1': 'Work Place Resources',
        'Option.2': 'Technical/System support',
        'Option.3': 'Environment/Room setting'
      });
    }
});





// ------------------------------------------------------------------------------------
//          Ask for more details based on which support_type is clicked on
//-------------------------------------------------------------------------------------

xapi.event.on('UserInterface Message Prompt Response', (event) => {
    
    if (event.FeedbackId === 'support_type') { 
    
        if (event.OptionId === '1') { // Work Place Resources was selected
      
            // Workplace resources support - G
            roomId = "Y2lzY29zcGFyazovL3VzL1JPT00vNzA0ZDZkNzEtMTAyYy0zMGY2LTgyZGYtOTg4M2E0NzRkODcx";

            xapi.command('UserInterface Message TextInput Display', {
                FeedbackId: 'response_wpr',
                SubmitText: 'Submit',
                Text: 'Please provide more details:',
                Placeholder: 'Brief description of issue',                  
                Title: 'Work Place Resources'
            });
      
        } else if (event.OptionId === '2') { // Technical Support was selected
      
            // Techical support - C
            roomId = "Y2lzY29zcGFyazovL3VzL1JPT00vYmNjNjAzOWEtMWI5OC0zZTdjLTgwNjEtMjM1NTdjNjZmNmVm";
      
            xapi.command('UserInterface Message TextInput Display', {
                FeedbackId: 'response_technical',
                SubmitText: 'Submit',
                Text: 'Please provide more details:',
                Placeholder: 'Brief description of issue',  
                Title: 'Technical/System support'
            });
        } else if (event.OptionId === '3') { // Environmental (Room) Support was selected
     
            // Environmental room support - M
            roomId = "Y2lzY29zcGFyazovL3VzL1JPT00vYWY4ZWY1YmEtMTY0Ny0zYzZlLTllNmMtMWI1NGUwNjQ2ODY5";

            xapi.command('UserInterface Message TextInput Display', {
                FeedbackId: 'response_room',
                SubmitText: 'Submit',
                Text: 'Please provide more details:',
                Placeholder: 'Brief description of issue',                
                Title: 'Room support'
            });
        }
    }
});





// ------------------------------------------------------------------------------------
//      Function that generates a response once the 'Submit' button is pressed
//-------------------------------------------------------------------------------------

xapi.event.on('UserInterface Message TextInput Response', (event) => {
  
    // If 'submit' button was pressed after entering details about the issue, then request the user's CEC: 
    if ((event.FeedbackId === 'response_wpr', 'response_technical', 'response_room') && (event.FeedbackId !== 'response_cec')) {
    
        // Append the issue information to the array called 'output'
        output.push("The issue is: " + event.Text);
    
        //print statement for see if the issue was appended to the 'output' array correctly. 
        console.log("output is " + JSON.stringify(output)); 
    
        xapi.command('UserInterface Message TextInput Display', {
            FeedbackId: 'response_cec',
            Text: 'Please input your CEC id:',
            Placeholder: 'e.g. crobbins',
            Title: 'Contact details'
        });
    }
  
    // If 'submit' button was pressed after entering CEC details, then generate a 'Case Successfully Opened' message for the user: 
    if (event.FeedbackId === 'response_cec') {
    
        // Append the CEC details to the array called 'output'
        output.push("The CEC is: " + event.Text);
    
        //print statement for see if the CEC was appended to the 'output' array correctly. 
        console.log("output is " + JSON.stringify(output));   
    
        //print statement to see CEC input. 
        console.log("Case requestor CEC is: " + event.Text);
        
        // add IP address text to output array 
        output.push("The IP Address of the unit is: " + systemInfo.IpAddress);        
        
        // add serial number text to output array 
        output.push("The Serial Number of the unit is: " + systemInfo.SystemSerialNumber);        
        
        // add software version text to output array 
        output.push("The Software Version of the unit is: " + systemInfo.softwareVersion);        
    
        //push the whole output array to webex teams
        postToTeams(JSON.stringify(output), console.log);
    }
});





//----------------------------------------------------------------------------------------------------
//    Automatically retrieve information from the system itself and add to webex teams message
//----------------------------------------------------------------------------------------------------

function init() {
    xapi.status.get('SystemUnit Software Version').then((value) => {
        systemInfo.softwareVersion = value;
        //console.log("output is" + JSON.stringify(output)); //test purposes
    });


    xapi.status.get('Network 1 IPv4 Address').then((value) => {
        systemInfo.IpAddress = value;
        //console.log("IP Address:" + systemInfo.IpAddress); //test purposes
    }); 
    
    
    xapi.status.get('SystemUnit Hardware Module SerialNumber').then((value) => {
        systemInfo.SystemSerialNumber = value;
        //console.log("output is" + JSON.stringify(output)); //test purposes
    });     


/* For some reason, neither of these work:  

    xapi.config.get('SystemUnit Name').then((value) => { 
        systemInfo.systemName = value;
        output.push("TEST1: The System Name is: " + systemInfo.systemName);
        //console.log("output is " + JSON.stringify(output)); //test purposes        
    }); 

    
    xapi.status.get('UserInterface ContactInfo Name').then((value) => {
        systemInfo.SystemName = value; 
        output.push("TEST2: The System Name is: " + systemInfo.systemName);
        console.log("output is " + JSON.stringify(output)); //test purposes        
    });     
*/
}

init();