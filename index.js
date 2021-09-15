const http = require("http")
const app = require("express")()
app.get("/", (req,res) => res.sendFile(__dirname + "/index.html"))
//app.listen(3001, () => console.log("Listening on http port 3001"))
const websocketServer = require("websocket").server

const host  = "127.0.0.1"
const port = process.env.PORT || 3000

const httpServer = http.createServer(app)
httpServer.listen(port, () => console.log(`Listening on ${port}`))
//hashmap clients
const clients = {}
const users = {}
const games = {}
const scores = {"eric": 100, "mary": 50, "bob": 30, "alice": 60, "tristen": 80, "moven": 120}

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
        //a user wants to register
        if (result.method === "register"){
            const clientId = result.clientId
            const username = result.username
            const publickey = result.publickey

            const payLoad = {
                "method": "register",
                "username": username,
                "publickey": publickey
            }

            users[username] = {
                "publickey": publickey,
                "clientId": clientId,
                "gameId": null
            }

            const con = clients[clientId].connection
            con.send(JSON.stringify(payLoad))
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
            }
            else{
                payLoad = {
                    "method": "login",
                    "result": "fail",
                    "username": username,
                    "publickey": publickey
                }
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
                    "question": null
                }

                users[username].gameId = gameId

                const payLoad = {
                    "method": "create",
                    "game": games[gameId]
                }

                const con = clients[clientId].connection
                con.send(JSON.stringify(payLoad))
            }
            
        }
        //a user wants to join a game
        if (result.method === "join"){
            const clientId = result.clientId
            const username = result.username
            const hostname = result.hostname

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