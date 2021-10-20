const http = require("http")
const express = require("express")
const app = express()
//app.get("/", (req,res) => res.sendFile(__dirname + "/index.html"))
app.use(express.static("client"))
//app.listen(3001, () => console.log("Listening on http port 3001"))
const websocketServer = require("websocket").server

//const host  = "127.0.0.1"
const port = process.env.PORT || 3000

const httpServer = http.createServer(app)
httpServer.listen(port, () => console.log(`Listening on ${port}`))
//hashmap clients
const clients = {}
const users = {}
const games = {}
// const scores = {"eric": 100, "mary": 50, "bob": 30, "alice": 60, "tristen": 80, "moven": 120}
const scores = {}

var scorelist = Object.keys(scores).map(function(key) {
return [key, scores[key]];
});
// Sort the array based on the second element
scorelist.sort(function(first, second) {
return second[1] - first[1];
});
// Create a new array with only the first 5 items
console.log(scorelist.slice(0, 5));
console.log(scorelist[0])

//get questions
const questions = require(__dirname + "/questions.json")
const numofquestions = Object.keys(questions).length

const wsServer = new websocketServer({
    "httpServer": httpServer
})

wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin)
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        // I have received a message from the client
        const result = JSON.parse(message.utf8Data)
        // Record Host Client ID
        if (result.method === "hosting"){
            hostID = result.clientId
        }
        //a user wants to register
        if (result.method === "register"){
            console.log(clients)
            console.log(users)

            const clientId = result.clientId
            const username = result.username
            const publickey = result.publickey

            // 將分數計入後端
            scores[username] = {
                'totalPoints': 0,
                'currentPoints': 0
            }

            if ((username in users) && (users[username].publickey === publickey)){
                users[username].clientId = clientId
                payLoad = {
                    "method": "register",
                    "result": "fail",
                    "username": username,
                    "publickey": publickey
                }

                console.log("Player with username: " + username +" and public key: " + publickey + " already registered")
            }
            else{
                payLoad = {
                    "method": "register",
                    "result": "success",
                    "username": username,
                    "publickey": publickey
                }

                users[username] = {
                    "publickey": publickey,
                    "clientId": clientId,
                    "gameId": null
                }

                console.log("Player registered with username: " + username +" and public key: " + publickey)
            }

            const con = clients[clientId].connection
            con.send(JSON.stringify(payLoad))

            // Send message to leadBoard
            sendBoardMessage()
        }
        //a user wants to login
        if (result.method === "login"){
            const clientId = result.clientId
            const username = result.username
            const publickey = result.publickey
            var payLoad = {}

            if ((username in users) && (users[username].publickey === publickey)){
                users[username].clientId = clientId

                payLoad = {
                    "method": "login",
                    "result": "success",
                    "username": username,
                    "publickey": publickey
                }

                console.log("Player logined with username: " + username +" and public key: " + publickey)
            }
            else{
                payLoad = {
                    "method": "login",
                    "result": "fail",
                    "username": username,
                    "publickey": publickey
                }

                console.log("Player with username: " + username +" and public key: " + publickey + " not registered")
            }

            const con = clients[clientId].connection
            con.send(JSON.stringify(payLoad))

        }
        //a user wants to create a new game
        if (result.method === "create"){
            const clientId = result.clientId
            const username = result.username
            const gameId = guid()

            if ((username in users) && (users[username].clientId === clientId)){
                games[gameId] = {
                    "id": gameId,
                    "host": result.username,
                    "opponent": null,
                    "question": null,
                    'preparedNum': 0,
                    'questionNum': 1
                }

                users[username].gameId = gameId

                const payLoad = {
                    "method": "create",
                    "game": games[gameId],
                }

                console.log("Game successfully created with host: " + username +" and game Id: " + gameId)

                const con = clients[clientId].connection
                con.send(JSON.stringify(payLoad))
            }
            
        }
        //a user wants to join a game
        if (result.method === "join"){
            const clientId = result.clientId
            const username = result.username
            const hostname = result.hostname
            console.log('successfully join')
            if ((hostname in users) && (users[hostname].gameId !== null)){
                games[users[hostname].gameId].opponent = username
                users[username].gameId = users[hostname].gameId

                const payLoad = {
                    "method": "join",
                    "game": games[users[hostname].gameId]
                }

                const con = clients[clientId].connection
                con.send(JSON.stringify(payLoad))
            }

        }
        if (result.method === "addPoints"){
            const gameId = result.gameId
            if (result.isHost){
                scores[games[gameId].host].totalPoints += result.points
                scores[games[gameId].host].currentPoints += result.points
            }
            else{
                scores[games[gameId].opponent].totalPoints += result.points
                scores[games[gameId].opponent].currentPoints += result.points
            }
            const payLoad = {
                'method': 'updatePoints',
                'hostScores': scores[games[gameId].host].currentPoints,
                'opponentScores': scores[games[gameId].opponent].currentPoints
            }
            
            const con1 = clients[users[games[gameId].host].clientId].connection
            const con2 = clients[users[games[gameId].opponent].clientId].connection
        
            con1.send(JSON.stringify(payLoad))
            con2.send(JSON.stringify(payLoad))
        }
        //start a game
        if (result.method === "startgame"){
            const gameId = result.gameId
            returnQuestion(gameId)
        }
        if (result.method === "answerCompleted"){
            const gameId = result.gameId
            games[gameId]['preparedNum'] += 1

            if (games[gameId]['preparedNum'] == 2){
                games[gameId]['preparedNum'] = 0
                games[gameId]['questionNum'] += 1
                
                returnQuestion(gameId)
            }
        }
        
        if (result.method === 'timeUp'){
            const gameId = result.gameId
            games[gameId]['preparedNum'] = 0
            games[gameId]['questionNum'] += 1
            returnQuestion(gameId)
        }
        //a user wants to get a question
        if (result.method === "getquestion"){
            const clientId = result.clientId
            const username = result.username

            const randomquestionnum = Math.floor(Math.random() * numofquestions)
            const randomquestion = questions[randomquestionnum]
            //console.log(randomquestion)
            games[users[username].gameId].question = randomquestion

            const payLoad = {
                "method": "getquestion",
                "game": games[users[username].gameId]
            }

            const con = clients[clientId].connection
            con.send(JSON.stringify(payLoad))
        }
        if (result.method === "endGame"){
            const gameId = result.gameId
            const clientId = result.clientId
            let isWin = null
            let hostScore = scores[ games[gameId]['host'] ].currentPoints
            let opponentScore = scores[ games[gameId]['opponent'] ].currentPoints
            if (result.isHost){
                if (hostScore > opponentScore){
                    isWin = true
                    scores[ games[gameId].host ].totalPoints += 1;
                }
                else if(hostScore < opponentScore){
                    isWin = false
                    scores[ games[gameId].host ].totalPoints -= 1;
                }
            }
            else{
                if (hostScore > opponentScore){
                    isWin = false
                    scores[ games[gameId].opponent ].totalPoints -= 1;
                }
                else if(hostScore < opponentScore){
                    isWin = true
                    scores[ games[gameId].opponent ].totalPoints += 1;
                }
            }
            games[gameId].modifiedTime += 1;
            if (games[gameId].modifiedTime == 2){
                scores[ games[gameId].host ].currentPoints = 0;
                scores[ games[gameId].opponent ].currentPoints = 0;
                // Send message to leadBoard
                sendBoardMessage()
            }
            const payLoad = {
                'method': 'gameResult',
                'isWin': isWin
            }
            const con = clients[clientId].connection
            con.send(JSON.stringify(payLoad))
        }
    })

    //generate a new clientId
    const clientId = guid()
    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect", 
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))

})

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();

function returnQuestion(gameId) {
    const randomquestionnum = Math.floor(Math.random() * numofquestions)
    const randomquestion = questions[randomquestionnum]

    games[gameId].question = randomquestion
    const payLoad = {
        "method": "newQuestion",
        "game": games[gameId],
        "questionNum": games[gameId]['questionNum'],
        "host": games[gameId].host,
        "opponent": games[gameId].opponent
    }

    const con1 = clients[users[games[gameId].host].clientId].connection
    const con2 = clients[users[games[gameId].opponent].clientId].connection

    con1.send(JSON.stringify(payLoad))
    con2.send(JSON.stringify(payLoad))
}

function sendBoardMessage(){
    if (hostID){
        payLoad = {
            "method": "competitors",
            "data": scores
        }
        const con = clients[hostID].connection
        con.send(JSON.stringify(payLoad))
    }
}