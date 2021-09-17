let clientId = null
let username = null
let publickey = null
var HOST = location.origin.replace(/^http/, 'ws')
let ws = new WebSocket(HOST)
// let ws = new WebSocket("ws://172.20.10.3:9091")
const vsTxt = document.querySelector('.text')
const formBg = document.querySelector('.form_bg')
const loginForm = document.querySelector('form:nth-child(1)')
const newForm = document.querySelector('form:nth-child(2)')
const userName = document.getElementById('name')
const userPublicKey = document.getElementById('publicKey')
const roomNumber = document.getElementById('roomNum')
const timer = document.getElementById('timer')
const questionBoard = document.querySelector('.questions')

// Buttons
const btnRegister = document.getElementById('btnRegister')
const btnLogin = document.getElementById('btnLogin')
const btnCreateRoom = document.getElementById('creatRoom')
const btnJoinRoom = document.getElementById('joinRoom')

// Question
const question = document.getElementById('question')
const answerA = document.getElementById('choiceA')
const answerB = document.getElementById('choiceB')
const answerC = document.getElementById('choiceC')
const answerD = document.getElementById('choiceD')

// Create Counter Animation
class Timer{
    constructor(){
        this.canvas = document.querySelector('canvas.sec')
        this.ctx = this.canvas.getContext('2d')
        this.count = 0
        this.time = 10
        this.run = 0
        this.runStatus = false
    }
    // 渲染最基礎的圓圈
    init() {
        this.canvas.width = 150
        this.canvas.height = 150
        this.ctx.beginPath()
        this.ctx.arc(75, 85, 60, 0, 2 * Math.PI)
        this.ctx.strokeStyle = '#fff'
        this.ctx.lineWidth = 5
        this.ctx.stroke()
        this.ctx.closePath()
    }
    transformPI(fraction) {
        return Math.PI * fraction
    }
    displayTime(time){
        this.ctx.font = "45px sans-serif"
        this.ctx.textAlign = 'center'
        this.ctx.fillText(time, 75, 100)
    }
    animateEffect(fraction){
        this.ctx.beginPath()
        this.ctx.arc(75, 85, 60, this.transformPI(-1/2), this.transformPI(-1/2 + fraction))
        this.ctx.strokeStyle = '#000'
        this.ctx.stroke()
        this.ctx.closePath()
    }
    update(){
        this.ctx.clearRect(0, 0, 150, 150)
        this.init()
        this.displayTime(10 - this.run)
        if (this.runStatus)
        {
            if (this.count >= 2)
            {
                this.count %= 2
                this.run ++;
            }
            this.displayTime(10 - this.run)
            this.animateEffect(this.count)
            // 設定圓弧長度
            this.count += 0.02
        }
    }
}

// Common Function
// 隱藏物件
function hideElement(...args){
    for (let i = 0; i < args.length; i++) {
        args[i].style.display = 'none'
    }
}
// 顯示新表單
function showElement(ele, displayType) {
    ele.style.display = displayType
}
// 新增class名稱
function addClass(pos, className) {
    pos.classList.add(className)
}

class QuestionsBoard{
    constructor(){
        this.questionTable = question
        this.ans1 = answerA
        this.ans2 = answerB
        this.ans3 = answerC
        this.ans4 = answerD
    }
    showQuestion() {
        
    }
    // 顯示場次
    showQuestionNum(num) {
        question.innerText = '第' + num + '場'
    }
    // 移除題目顯示效果
    removeEffect() {
        question.classList.remove('typing')
    }
    // 等待對手加入對戰
    waitingToStart() {
        addClass(question, 'typing')
        showElement(question, 'inline-block')
        question.innerText = '等待對手加入遊戲...'
    }
}

class Game {
    // 表單更換流程
    changeForm() {
        hideElement(loginForm, vsTxt)
        showElement(newForm, 'flex')
        addClass(formBg, 'new_form')
    }
    // 遊戲開始前的準備
    preGame() {
        // 表單消失動畫
        addClass(formBg, 'formBg_animate')
        addClass(newForm, 'form_animate')
        // 隱藏title，置換為時鐘
        $('.title').fadeOut()
        showElement(timer, 'inline-block')
        // 時鐘動畫
        setInterval(()=>{
            time.update()
        }, 1000/30)
        // 問題欄位
        setTimeout(showElement, 3000, questionBoard, 'inline-block') 
    }

}
let time = new Timer
let board = new QuestionsBoard
let game = new Game

// 社員第一次登入
btnRegister.addEventListener('click', function (e) {
    e.preventDefault()
    if (userName.value.length !== 0 && userPublicKey.value.length !== 0)
    {
        const payLoad = {
            'method': 'regitster',
            'clientId': clientId, 
            'username': userName.value,
            'publickey': userPublicKey.value
        }
        game.changeForm()
        ws.send(JSON.stringify(payLoad))
    }
})

// 社員已經登入過
btnLogin.addEventListener('click', function (e) {
    e.preventDefault()
    if (userName.value.length !== 0 && userPublicKey.value.length !== 0)
    {
        const payLoad = {
            "method": "login",
            "clientId": clientId,
            "username": userName.value,
            "publickey": userPublicKey.value
        }
        
        ws.send(JSON.stringify(payLoad))
    }
})


// 創建房間
btnCreateRoom.addEventListener('click', function (e) {
    e.preventDefault()
    const payLoad = {
        "method": "create",
        "clientId": clientId,
        "username": username
    }
    game.preGame()
    ws.send(JSON.stringify(payLoad))
})
// 加入房間
btnJoinRoom.addEventListener('click', function (e) {
    e.preventDefault()
    if (roomNumber.value.length !== 0)
    {
        const payLoad = {
            "method": "join",
            "clientId": clientId,
            "username": username,
            // 這地方應該有問題，我還沒設計host名稱
            "hostname": txtHostname.value
        }
        game.preGame()
        ws.send(JSON.stringify(payLoad))
    }
})




ws.onmessage = message => {
    //message.data
    const response = JSON.parse(message.data)
    console.log(response)

    //connect
    if (response.method === "connect"){
        clientId = response.clientId
        console.log("Client Id set successfully: " + clientId)
    }

    //register
    if (response.method === "register"){
        username = response.username
        publickey = response.publickey
        console.log("Player registered with username:" + username + " and public key: " + publickey)
    }

    //login
    if (response.method === "login"){
        result = response.result
        username = response.username
        publickey = response.publickey

        if (result === "success"){
            console.log("Player logined with username: " + username + " and public key: " + publickey)
            game.changeForm()
        }
        else if (result === "fail"){
            console.log("Player with username:" + username + " and public key: " + publickey + " not registered")
        }
    }

    //create
    if (response.method === "create"){
        //clientId = response.clientId
        console.log("Game successfully created with host: " + response.game.host +" and game Id: " + response.game.id)
    }

    //join 
    if (response.method === "join"){
        //clientId = response.clientId
        console.log("Game successfully joined with host: " + response.game.host +" and game Id: " + response.game.id)
    }

    //getquestion
    if (response.method === "getquestion"){
        //clientId = response.clientId
        console.log(response.game.question.Q)
        console.log(response.game.question.A)        
        console.log(response.game.question.B)  
        console.log(response.game.question.C)  
        console.log(response.game.question.D)  
        console.log(response.game.question.Ans)        
    }
}
