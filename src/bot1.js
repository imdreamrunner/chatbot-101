var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());


var bot = new builder.UniversalBot(connector, [function (session) {
    session.beginDialog('DisplayMenu');
}]);


bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            // to determine whether the bot is one of the newly added member.
            // useful in group chat.
            if (identity.id === message.address.bot.id) {
                bot.beginDialog(message.address, 'DisplayMenu');
            }
        });
    }
});


bot.dialog('DisplayMenu', [function (session) {
    var msg = new builder.Message(session)
        .text("Hi! Welcome to the IONS Restaurants.\nWhat can I do for you today?")
        .suggestedActions(
            builder.SuggestedActions.create(
                session, [
                    builder.CardAction.imBack(session, "Can I get a table?", "Get A Table"),
                    builder.CardAction.imBack(session, "I wish to order some take-away.", "Order Take-Away")
                ]
            ));
    session.send(msg);
    session.endDialog();
}]);


bot.dialog('GetTable', [
    function (session, args, next) {
        session.dialogData.table = {}
        builder.Prompts.number(session, "How many people are in your party?");
    },
    function (session, args, next) {
        session.dialogData.table.size = args.response;
        session.endDialog(`No problem! We will get you a table for ${session.dialogData.table.size}.`);
    }
])
.triggerAction({
    matches: /(get a table)/i,
    confirmPrompt: "Are you sure to cancel the table?" // confirmation text when the dialog is interrupted
})
.cancelAction(
    'CancelGetTable',  // action name
    'You have canceled for getting a table.',  // cancel message to send
    {
        matches: /^(cancel|nevermind)/i,
        confirmPrompt: "Are you sure?"  // confirmation text when the dialog is canceled
    }
);


bot.dialog('TakeAway', [
    function (session, args, next) {
        session.dialogData.order = {}
        builder.Prompts.text(session, "What would you like to order?");
    },
    function (session, args, next) {
        session.dialogData.order.item = args.response;
        builder.Prompts.number(session, `What many ${session.dialogData.order.item} would you like?`);
    },
    function (session, args, next) {
        session.dialogData.order.quantity = args.response;
        session.endDialog(`Perfect! We will prepare ${session.dialogData.order.quantity} ${session.dialogData.order.item} for you.`);
    }
])
.triggerAction({
    matches: /(take away|take-away)/i,
    confirmPrompt: "Are you sure you to cancel take-away?" // confirmation text when the dialog is interrupted
})
.cancelAction(
    'CancelGetTable',  // action name
    'You have canceled the take-away.',  // cancel message to send
    {
        matches: /^(cancel|nevermind)/i,
        confirmPrompt: "Are you sure?"  // confirmation text when the dialog is canceled
    }
);


bot.dialog('Bye', [
    function (session, args, next) {
        session.endConversation('Please come again!')
    }
])
.triggerAction({
    matches: /(bye)/i
});