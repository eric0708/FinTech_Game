let clientId = null
let username = null
let publickey = null
let gameId = null
var HOST = location.origin.replace(/^http/, 'ws')
let ws = new WebSocket(HOST)
let isHost = null

// let ws = new WebSocket("ws://172.20.10.3:9091")
const vsTxt = document.querySelector('.text')
const formBg = document.querySelector('.form_bg')
const loginForm = document.querySelector('form:nth-child(1)')
const newForm = document.querySelector('form:nth-child(2)')
const userName = document.getElementById('name')
const userPublicKey = document.getElementById('publicKey')
const inputHostName = document.getElementById('txthostName')
const titleTxt = document.getElementById('title')
const timer = document.getElementById('timer')

// Buttons
const btnRegister = document.getElementById('btnRegister')
const btnLogin = document.getElementById('btnLogin')
const btnCreateRoom = document.getElementById('creatRoom')
const btnJoinRoom = document.getElementById('joinRoom')

// Question
const questionBoard = document.querySelector('.questions')
const question = document.getElementById('question')
const answerA = document.getElementById('choiceA')
const answerB = document.getElementById('choiceB')
const answerC = document.getElementById('choiceC')
const answerD = document.getElementById('choiceD')

// Personal Grades & Name
const hostGradeBar = document.querySelector('.grade_bar1 .points')
const opponentGradeBar = document.querySelector('.grade_bar2 .points')
const hostPoints = document.querySelector('.grade_bar1 .grade1')
const opponentPoints = document.querySelector('.grade_bar2 .grade2')
const hostName = document.querySelector('.pic1')
const opponentName = document.querySelector('.pic2')

// Game Ending
const gameResultBoard = document.querySelector('.game_result')
const winImg = document.querySelector('.fa-trophy')
const loseImg = document.querySelector('.fa-frown-o')
const resultTitle = document.querySelector('.game_result .title')
const price = document.querySelector('.price')
const ranking = document.querySelector('.rank')
// Create Counter Animation
class Timer{
    constructor(){
        this.canvas = document.querySelector('canvas.sec')
        this.ctx = this.canvas.getContext('2d')
        this.count = 0
        this.time = 10
        this.run = 0
        this.timeUp = false
        this.runStatus = false
        this.timeLimit = 10
    }
    // 渲染最基礎的圓圈
    init() {
        this.canvas.width = 150
        this.canvas.height = 150
        this.ctx.beginPath()
        this.ctx.arc(75, 75, 60, 0, 2 * Math.PI)
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
        this.ctx.fillText(time, 75, 90)
    }
    animateEffect(fraction){
        this.ctx.beginPath()
        this.ctx.arc(75, 75, 60, this.transformPI(-1/2), this.transformPI(-1/2 + fraction))
        this.ctx.strokeStyle = '#000'
        this.ctx.stroke()
        this.ctx.closePath()
    }
    ifTimeUp(){
        if (this.run >= 10){
            this.run = 0
            this.count = 0
            this.timeUp = true
            this.runStatus = false
        }
    }
    reset(){
        this.runStatus = false
        this.timeUp = false
        this.count = 0
        this.run = 0
    }
    update(){
        this.ctx.clearRect(0, 0, 150, 150)
        this.init()
        this.ifTimeUp()
        this.displayTime(10 - this.run)
        if (this.runStatus)
        {
            if (this.count >= 2)
            {
                this.count %= 2
                this.run ++;
            }
            this.displayTime(this.timeLimit - this.run)
            this.animateEffect(this.count)
            // 設定圓弧長度
            this.count += 0.0333
        }
    }
}

class GradeBar{
    constructor(){
        this.hostPoint = 0
        this.opponentPoint = 0
        this.hostBar = hostGradeBar
        this.opponentBar = opponentGradeBar
        this.hostPointsControl = hostPoints
        this.opponentPointsControl = opponentPoints
        this.hostNameControl = hostName
        this.opponentNameControl = opponentName
    }
    init(){
        this.setBar()
        this.setPoints()
    }
    update(res){
        console.log(res)
        this.hostPoint = res.hostScores
        this.opponentPoint = res.opponentScores
        this.setBar()
        this.setPoints()
    }
    updateToBackEnd(){
        const payLoad = {
            'method': 'addPoints',
            'gameId': gameId,
            'isHost': isHost,
            'points': this.calculatePoints(),
        }
        ws.send(JSON.stringify(payLoad))
    }
    calculatePoints(){
        console.log((time.run / time.timeLimit) * 60)
        return (1 - (time.run / time.timeLimit)) * 60
    }
    setPoints(){
        this.hostPointsControl.innerHTML = this.hostPoint
        this.opponentPointsControl.innerHTML = this.opponentPoint
    }
    setBar(){
        this.hostBar.style.height = this.pointsToWidth(this.hostPoint)
        this.opponentBar.style.height = this.pointsToWidth(this.opponentPoint)
    }
    pointsToWidth(points){
        const width = ( points / 300 ) * 340
        return width + 'px'
    }
    settingName(hostName, opponentName){
        this.hostNameControl.setAttribute('data-text', hostName)
        this.opponentNameControl.setAttribute('data-text', opponentName)
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
function showElement(displayType, ...elements) {
    for (let i = 0; i < elements.length; i++)
        elements[i].style.display = displayType
}
// 新增class名稱
function addClass(pos, className) {
    pos.classList.add(className)
}

class QuestionsBoard{
    constructor(){
        this.board = questionBoard
        this.questionTable = question
        this.ans1 = answerA
        this.ans2 = answerB
        this.ans3 = answerC
        this.ans4 = answerD
        this.result = gameResultBoard
        this.winImg = winImg
        this.loseImg = loseImg
        this.correspond = {
            'A': this.ans1,
            'B': this.ans2,
            'C': this.ans3,
            'D': this.ans4
        }
        this.clicked = false
        this.correctAns = null
        this.chooseOption = null
    }
    showOptions(){
        showElement('inline-block', 
        this.ans1, this.ans2, this.ans3, this.ans4)
    }
    showQuestion(res) {
        this.questionTable.innerText = res.game.question.Q
        this.ans1.innerText = res.game.question.A
        this.ans2.innerText = res.game.question.B
        this.ans3.innerText = res.game.question.C
        this.ans4.innerText = res.game.question.D
        this.correctAns = res.game.question.Ans
        this.showOptions()
    }
    hideQuestion(){
        hideElement(this.ans1, this.ans2, this.ans3, this.ans4)
    }
    endStatus(){
        hideElement(this.board)
    }
    // 顯示場次
    showQuestionNum(num) {
        addClass(this.questionTable, 'typing')
        if (num == game.questionNum)
            this.questionTable.innerText = '最後一題'
        else
            this.questionTable.innerText = '第 ' + num + ' 題'
    }
    // 移除題目顯示效果
    removeEffect() {
        this.questionTable.classList.remove('typing')
    }
    // 等待對手加入對戰
    waitingToStart() {
        showElement('inline-block', this.questionTable)
        this.questionTable.innerText = '等待對手加入遊戲...'
    }
    // 選擇答案是否正確
    ifCorrect(ans){
        if (!this.clicked){
            this.chooseOption = ans
            if (ans == this.correctAns)
            {
                this.rightAns(ans)
                bars.updateToBackEnd()
            }
            else
                this.falseAns(ans)
            this.clickedStatus()
        }
    }
    rightAns(ans){
        addClass(this.correspond[ans], 'rightAns')
    }
    falseAns(ans){
        addClass(this.correspond[ans], 'wrongAns')
    }
    clickedStatus(){
        addClass(this.ans1, 'clicked')
        addClass(this.ans2, 'clicked')
        addClass(this.ans3, 'clicked')
        addClass(this.ans4, 'clicked')
    }
    clearClickedStatus(){
        this.ans1.classList.remove('clicked')
        this.ans2.classList.remove('clicked')
        this.ans3.classList.remove('clicked')
        this.ans4.classList.remove('clicked')
        if (this.chooseOption){
            this.correspond[this.chooseOption].classList.remove('rightAns')
            this.correspond[this.chooseOption].classList.remove('wrongAns')    
        }
    }
    showGameResult(isWin){
        showElement('flex', this.result)
        hideElement(this.winImg)
        if (isWin){
            resultTitle.innerHTML = `恭喜 ${username}<br>獲得這場比賽的勝利`
            price.innerText =  `您獲得＄1000顆熊熊幣`
            ranking.innerText = `目前積分在大會中排名第3名`
        }
        // 平手情況
        else if(isWin == null){
            resultTitle.innerHTML = `最終的比賽結果為和局<br>看來你們旗鼓相當`
            price.innerText =  `您沒有損失任何熊熊幣`
            ranking.innerText = `目前積分在大會中排名第3名`
        }
        else{
            resultTitle.innerHTML = `${username} 很遺憾的<br>看來你對金融科技還沒有很熟悉`
            price.innerText =  `您損失＄1000顆熊熊幣`
            ranking.innerText = `目前積分在大會中排名第33名`

            // Send transaction through ethereum
            // Connecting to Metamask
            async function connectMetamask() {
                const provider = await detectEthereumProvider()
                if (provider) {          
                    console.log('Ethereum successfully detected!')
                    const chainId = await provider.request({
                        method: 'eth_chainId'
                    })
                } else {
                    console.error('Please install MetaMask!', error)
                }
            }
            connectMetamask();

            // Basic Params setting
            const fromAddress = ethereum.selectedAddress
            const toAddress = userPublicKey.value
            const tokenAmountToSend = 1     // unit: 1 token
            const valueToSend_DEC = `${tokenAmountToSend}` + '000000000000000000'

            const web3 = new Web3(Web3.givenProvider)
            let minABI = [
            // transfer function on ABI
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "_to",
                        "type": "address"
                    },
                    {
                        "name": "_value",
                        "type": "uint256"
                    }
                ],
                "name": "transfer",
                "outputs": [
                    {
                        "name": "success",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            }
            ];

            // sending custom token through minABI
            let contractAddress = "0xcADC9b53e03635649ac09Ae71F5A1709a2b51268";
            let contract = new web3.eth.Contract(minABI, contractAddress);
            contract.methods.transfer(toAddress, valueToSend_DEC).send({
                    from: fromAddress
            });
        }
        setTimeout(()=>{
            game.startNextGame()
            hideElement(gameResultBoard)
        }, 10000)
    }
}

class Game {
    constructor(){
        this.gameActive = false
        this.gameId = null
        this.questionNum = 5
        this.timeRunner = null
    }
    // 表單更換流程
    changeForm() {
        hideElement(loginForm, vsTxt)
        showElement('flex', newForm)
        addClass(formBg, 'new_form')
    }
    // 遊戲開始前的準備
    preGame() {
        // 表單消失
        formBg.style.opacity = 0
        // 隱藏title，置換為時鐘
        hideElement(titleTxt)
        showElement('inline-block', timer)
        // 時鐘動畫
        this.timeRunner = setInterval(()=>{
            time.update()
        }, 1000/30)
        // 問題欄位
        setTimeout(showElement, 0, 'inline-block', questionBoard) 
        // 檢查是否完成
        setInterval(()=>{
            this.updateGame()
        }, 1000/30)
        // bars
        bars.init()
    }
    gameStart(res){
        board.showQuestion(res)
        this.gameActive = true
        time.runStatus = true
    }
    showQuestions(res){
        if (res.questionNum <= this.questionNum){
            bars.settingName(res.host, res.opponent)
            board.showQuestionNum(res.questionNum)
            setTimeout(()=>{
                this.gameStart(res)
            }, 2000)
        }
        else{
            this.endGame()
        }
    }
    checkAnswer(ans){
        board.ifCorrect(ans)
        board.clicked = true
        board.removeEffect()
    }
    changeNewQuestion(){
        board.hideQuestion()
        board.clearClickedStatus()
        this.gameActive = false
        board.clicked = false
        time.reset()
    }
    updateGame(){
        if (this.gameActive === true && (board.clicked === true || time.timeUp === true)){
            console.log('type1')
            this.gameActive = false
            const payLoad = {
                'method': 'answerCompleted',
                'gameId': gameId,
            }
            setTimeout(()=>{
                ws.send(JSON.stringify(payLoad))
            }, 1000)
        }
        if (time.timeUp){
            time.timeUp = false
            const payLoad = {
                'method': 'timeUp',
                'gameId': gameId,
            }
            setTimeout(()=>{
                ws.send(JSON.stringify(payLoad))
            }, 1000)
        }
    }
    updateScore(res){
        bars.update(res)        
    }
    endGame(){
        board.endStatus()
        clearInterval(this.timeRunner)
        // 傳送遊戲結束的消息給後端 並在前端顯示一個勝利或失敗的圖像
        const payLoad = {
            'method': 'endGame',
            'gameId': gameId,
            'clientId': clientId,
            'isHost': isHost
        }
        ws.send(JSON.stringify(payLoad))
    }
    showResult(isWin){
        board.showGameResult(isWin)
    }
    startNextGame(){
        showElement('flex', newForm)
        addClass(formBg, 'new_form')
        // 算是以防萬一
        time.reset()
        formBg.style.opacity = 1
    }
}
let time = new Timer
let board = new QuestionsBoard
let game = new Game
let bars = new GradeBar

// 社員第一次登入
btnRegister.addEventListener('click', function (e) {
    e.preventDefault()

    // Connecting to Metamask
    async function connectMetamask() {
        const provider = await detectEthereumProvider()
        if (provider) {          
            console.log('Ethereum successfully detected!')
            const chainId = await provider.request({
                method: 'eth_chainId'
            })
        } else {
            console.error('Please install MetaMask!', error)
        }
    }
    connectMetamask();

    // Basic Params setting
    // const fromAddress = '0x8F608b2DdAca497AaF5d3Cbe9731ACE0c7aFfC3E'
    const fromAddress = ethereum.selectedAddress
    const toAddress = userPublicKey.value
    const tokenAmountToSend = 1     // unit: 1 token
    const valueToSend_HEX = (tokenAmountToSend*1000000000000000000).toString(16)
    const valueToSend_DEC = `${tokenAmountToSend}` + '000000000000000000'

    // function sendTransaction() {
    //     // request transaction through metamask
    //     ethereum
    //         .request({
    //         method: 'eth_sendTransaction',
    //         params: [
    //             {
    //             from: fromAddress,
    //             to: toAddress,
    //             value: `0x${valueToSend_HEX}`,  // unit is wei
    //             gasPrice: '0x09184e72a000', // 10000000000000 wei, which is 0.00001 ether
    //             gas: '0x7530',              // gas price lowerbound is 21000 
    //             chainId: '0x4',
    //             },
    //         ],
    //         })
    //         .then((txHash) => console.log(txHash))
    //         .catch((error) => console.error);
    // }
    // sendTransaction();

    const web3 = new Web3(Web3.givenProvider)
    let minABI = [
    // transfer function on ABI
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "success",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
    ];

    // sending custom token through minABI
    let contractAddress = "0xcADC9b53e03635649ac09Ae71F5A1709a2b51268";
    let contract = new web3.eth.Contract(minABI, contractAddress);
    contract.methods.transfer(toAddress, valueToSend_DEC).send({
            from: fromAddress
    });

    if (userName.value.length !== 0 && userPublicKey.value.length !== 0)
    {
        const payLoad = {
            'method': 'register',
            'clientId': clientId, 
            'username': userName.value,
            'publickey': userPublicKey.value
        }
        
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
    
    ws.send(JSON.stringify(payLoad))
})
// 加入房間
btnJoinRoom.addEventListener('click', function (e) {
    e.preventDefault()
    if (inputHostName.value.length !== 0)
    {
        const payLoad = {
            "method": "join",
            "gameId": gameId,
            "clientId": clientId,
            "username": username,
            "hostname": inputHostName.value
        }
        
        ws.send(JSON.stringify(payLoad))
    }
})

answerA.addEventListener('click', (e)=>{
    e.preventDefault()
    game.checkAnswer('A')
})

answerB.addEventListener('click', (e)=>{
    e.preventDefault()
    game.checkAnswer('B')
})

answerC.addEventListener('click', (e)=>{
    e.preventDefault()
    game.checkAnswer('C')
})

answerD.addEventListener('click', (e)=>{
    e.preventDefault()
    game.checkAnswer('D')
})


ws.onmessage = message => {
    //message.data
    const response = JSON.parse(message.data)
    //connect
    if (response.method === "connect"){
        clientId = response.clientId
        console.log("Client Id set successfully: " + clientId)
    }

    //register
    if (response.method === "register"){
        result = response.result
        username = response.username
        publickey = response.publickey

        if (result === "success"){
            console.log("Player registered with username:" + username + " and public key: " + publickey)
            game.changeForm()
        }
        else if (result === "fail"){
            console.log("Player with username:" + username + " and public key: " + publickey + " already registered")
        }
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
        isHost = true
        gameId = response.game.id
        console.log("Game successfully created with host: " + response.game.host +" and game Id: " + response.game.id)
        game.preGame()
        board.waitingToStart()
    }

    //join 
    if (response.method === "join"){
        isHost = false
        gameId = response.game.id
        console.log("Game successfully joined with host: " + response.game.host +" and game Id: " + response.game.id)
        game.preGame()
        board.waitingToStart()
        const payLoad = {
            "method": "startgame",
            "gameId": gameId
        }
        ws.send(JSON.stringify(payLoad))     
    }

    //start game
    if (response.method === "startgame"){
        game.showQuestions(response)
        console.log(response)
    }

    if (response.method === 'newQuestion'){
        game.changeNewQuestion()
        game.showQuestions(response)
    }
    
    if (response.method === 'updatePoints'){
        game.updateScore(response)
    }

    // whether user win or not
    if (response.method === 'gameResult'){
        game.showResult(response.isWin)
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
