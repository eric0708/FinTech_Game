import Alert from 'react-bootstrap/Alert'
import React from 'react';
import ReactDOM  from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'
import './board.css'

let clientId = null
let username = null
let publickey = null
let gameId = null
var HOST = location.origin.replace(/^http/, 'ws')
let ws = new WebSocket(HOST)
let isHost = null
let result = null
let opponentpublickey = null

// let ws = new WebSocket("ws://172.20.10.3:9091")
const allGame = document.querySelector('.bg')
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

// LeadBoard
const rank = document.getElementById('rank')
const rankTxt = document.getElementById('rankTxt')
const rankPart = document.getElementById('rank-part')
const ice_breaking_problem = document.getElementById('ice-breaking')
const rightArr = document.querySelector('.ice-breaking .right')
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
    // ????????????????????????
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
            this.timeUp = true
            this.isTimeUp()
        }
    }
    isTimeUp(){
        this.runStatus = false
        this.count = 0
        this.run = 0
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
            // ??????????????????
            this.count += 0.0333
        }
        else{
            this.animateEffect(this.count)
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
        //console.log(res)
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
        //console.log((time.run / time.timeLimit) * 60)
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
    reset(){
        this.hostPoint = 0
        this.opponentPoint = 0
        this.setBar()
        this.setPoints()
    }
}

// Common Function
// ????????????
function hideElement(...args){
    for (let i = 0; i < args.length; i++) {
        args[i].style.display = 'none'
    }
}
// ???????????????
function showElement(displayType, ...elements) {
    for (let i = 0; i < elements.length; i++)
        elements[i].style.display = displayType
}
// ??????class??????
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
    // ????????????
    showQuestionNum(num) {
        addClass(this.questionTable, 'typing')
        if (num == game.questionNum)
            this.questionTable.innerText = '????????????'
        else
            this.questionTable.innerText = '??? ' + num + ' ???'
    }
    // ????????????????????????
    removeEffect() {
        this.questionTable.classList.remove('typing')
    }
    // ????????????????????????
    waitingToStart() {
        showElement('inline-block', this.questionTable)
        this.questionTable.innerText = '????????????????????????...'
    }
    // ????????????????????????
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
        showElement('inline-block', this.winImg)
        showElement('inline-block', this.loseImg)
        if (isWin){
            resultTitle.innerHTML = `?????? ${username}<br>???????????????????????????`
            price.innerText =  `?????????1???????????????`
            //ranking.innerText = `?????????????????????????????????3???`
            hideElement(this.loseImg)
        }
        // ????????????
        else if(isWin == null){
            resultTitle.innerHTML = `??????????????????????????????<br>????????????????????????`
            price.innerText =  `?????????????????????????????????`
            //ranking.innerText = `?????????????????????????????????3???`
            hideElement(this.winImg)
            hideElement(this.loseImg)
        }
        else{
            resultTitle.innerHTML = `${username} ????????????<br>????????????`
            price.innerText =  `?????????1???????????????`
            //ranking.innerText = `?????????????????????????????????33???`
            hideElement(this.winImg)
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
            const toAddress = opponentpublickey
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
            hideElement(this.winImg)
            hideElement(this.loseImg)
            hideElement(gameResultBoard)
        }, 5000)
    }
}

class Game {
    constructor(){
        this.gameActive = false
        this.gameId = null
        this.questionNum = 5
        this.timeRunner = null
    }
    // ??????????????????
    changeForm() {
        hideElement(loginForm, vsTxt)
        showElement('flex', newForm)
        addClass(formBg, 'new_form')
    }
    // ????????????????????????
    preGame() {
        // ????????????
        formBg.style.opacity = 0
        // ??????title??????????????????
        hideElement(titleTxt)
        showElement('inline-block', timer)
        // ????????????
        this.timeRunner = setInterval(()=>{
            time.update()
        }, 1000/30)
        // ????????????
        setTimeout(showElement, 0, 'inline-block', questionBoard) 
        // ??????????????????
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
        //console.log(time.timeUp);
        if (this.gameActive === true && (board.clicked === true || time.timeUp === true)){
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
        bars.reset()
        // time.isTimeUp()
        this.runStatus = false
        this.count = 0
        this.run = 0
        // ???????????????????????????????????? ????????????????????????????????????????????????
        const payLoad = {
            'method': 'endGame',
            'gameId': gameId,
            'clientId': clientId,
            'isHost': isHost
        }
        ws.send(JSON.stringify(payLoad))
        setTimeout(()=>{
            clearInterval(this.timeRunner)
        }, 100)
    }
    showResult(isWin){
        board.showGameResult(isWin)
    }
    startNextGame(){
        showElement('flex', newForm)
        addClass(formBg, 'new_form')
        // ??????????????????
        time.reset()
        formBg.style.opacity = 1
    }
}
class People{
    constructor(){
        this.challenger = []
        this.question = ['??????????????????', '?????????????????????', '??????????????????', '??????????????????????????????', '??????????????????', '??????????????????', '?????????????????????', '???????????????????????????', '?????????', '???????????????', '??????????????????']
        this.questionNum = 0
    }
    init(){
        allGame.style.display = "none"
        vsTxt.style.display = 'none'
        rankPart.style.display = 'inline-block'
        document.body.style.backgroundColor = "#333"
        this.updateQuestion()
        this.render()
    }
    updateQuestion(){
        rightArr.addEventListener('click', ()=>{
            this.questionNum += 1;
            this.render()
        })
    }
    update(){
        let color;
        this.sortPoints()
        this.renderList = this.challenger.map((variant, idx)=>{
            if (idx <= 2)
                color = "yellow";
            else
                color = 'grey'
            return `<div class="alert ${color}" key=${idx}>
                <h2>${idx + 1}.</h2>${variant.name}
                <h3>${variant.point}</h3>
            </div> `
        })
        this.renderList = this.renderList.join('')
        // console.log(this.renderList);
        this.render()
    }
    sortPoints(){
        this.challenger = this.challenger.sort((a, b)=>{
            return b.point - a.point;
        })
    }
    render(){
        ice_breaking_problem.innerText = `??????????????? ${this.question[this.questionNum]}`
        rank.innerHTML = this.renderList
    }
    recieveData(data){
        this.challenger = []
        for (const [key, value] of Object.entries(data)) {
            this.challenger.push({
                name: key,
                point: value.totalPoints
            })
        }
        this.update()
    }
}
let people = new People();
let time = new Timer()
let board = new QuestionsBoard()
let game = new Game()
let bars = new GradeBar()

// ?????????????????????
btnRegister.addEventListener('click', function (e) {
    e.preventDefault()
    if (userName.value === "Creator"){
        people.init()
        const payLoad = {
            method: 'hosting',
            clientId: clientId
        }
        ws.send(JSON.stringify(payLoad))
        return;
    }
    // ???????????????register
    const payLoad = {
        method: 'verify', 
        status: 'register',
        clientId: clientId,
        userName: userName.value,
        publickey: userPublicKey.value 
    }
    ws.send(JSON.stringify(payLoad))

    // // // Connecting to Metamask
    // // async function connectMetamask() {
    // //     const provider = await detectEthereumProvider()
    // //     if (provider) {          
    // //         console.log('Ethereum successfully detected!')
    // //         const chainId = await provider.request({
    // //             method: 'eth_chainId'
    // //         })
    // //     } else {
    // //         console.error('Please install MetaMask!', error)
    // //     }
    // // }
    // // connectMetamask();

    // // // Basic Params setting
    // // // const fromAddress = '0x8F608b2DdAca497AaF5d3Cbe9731ACE0c7aFfC3E'
    // // const fromAddress = ethereum.selectedAddress
    // // const toAddress = userPublicKey.value
    // // const tokenAmountToSend = 1     // unit: 1 token
    // // const valueToSend_HEX = (tokenAmountToSend*1000000000000000000).toString(16)
    // // const valueToSend_DEC = `${tokenAmountToSend}` + '000000000000000000'

    // // // function sendTransaction() {
    // // //     // request transaction through metamask
    // // //     ethereum
    // // //         .request({
    // // //         method: 'eth_sendTransaction',
    // // //         params: [
    // // //             {
    // // //             from: fromAddress,
    // // //             to: toAddress,
    // // //             value: `0x${valueToSend_HEX}`,  // unit is wei
    // // //             gasPrice: '0x09184e72a000', // 10000000000000 wei, which is 0.00001 ether
    // // //             gas: '0x7530',              // gas price lowerbound is 21000 
    // // //             chainId: '0x4',
    // // //             },
    // // //         ],
    // // //         })
    // // //         .then((txHash) => console.log(txHash))
    // // //         .catch((error) => console.error);
    // // // }
    // // // sendTransaction();

    // // const web3 = new Web3(Web3.givenProvider)
    // // let minABI = [
    // // // transfer function on ABI
    // // {
    // //     "constant": false,
    // //     "inputs": [
    // //         {
    // //             "name": "_to",
    // //             "type": "address"
    // //         },
    // //         {
    // //             "name": "_value",
    // //             "type": "uint256"
    // //         }
    // //     ],
    // //     "name": "transfer",
    // //     "outputs": [
    // //         {
    // //             "name": "success",
    // //             "type": "bool"
    // //         }
    // //     ],
    // //     "payable": false,
    // //     "stateMutability": "nonpayable",
    // //     "type": "function"
    // // }
    // // ];

    // // // sending custom token through minABI
    // // let contractAddress = "0xcADC9b53e03635649ac09Ae71F5A1709a2b51268";
    // // let contract = new web3.eth.Contract(minABI, contractAddress);
    // // contract.methods.transfer(toAddress, valueToSend_DEC).send({
    // //         from: fromAddress
    // // });

    // if (userName.value.length !== 0 && userPublicKey.value.length !== 0)
    // {
    //     const payLoad = {
    //         'method': 'register',
    //         'clientId': clientId, 
    //         'username': userName.value,
    //         'publickey': userPublicKey.value
    //     }
        
    //     ws.send(JSON.stringify(payLoad))
    // }
})

const registerSuccess = function(){
    // Connecting to Metamask
    // async function connectMetamask() {
    //     const provider = await detectEthereumProvider()
    //     if (provider) {          
    //         console.log('Ethereum successfully detected!')
    //         const chainId = await provider.request({
    //             method: 'eth_chainId'
    //         })
    //     } else {
    //         console.error('Please install MetaMask!', error)
    //     }
    // }
    // connectMetamask();

    // // Basic Params setting
    // // const fromAddress = '0x8F608b2DdAca497AaF5d3Cbe9731ACE0c7aFfC3E'
    // const fromAddress = ethereum.selectedAddress
    // const toAddress = userPublicKey.value
    // const tokenAmountToSend = 1     // unit: 1 token
    // const valueToSend_HEX = (tokenAmountToSend*1000000000000000000).toString(16)
    // const valueToSend_DEC = `${tokenAmountToSend}` + '000000000000000000'

    // // function sendTransaction() {
    // //     // request transaction through metamask
    // //     ethereum
    // //         .request({
    // //         method: 'eth_sendTransaction',
    // //         params: [
    // //             {
    // //             from: fromAddress,
    // //             to: toAddress,
    // //             value: `0x${valueToSend_HEX}`,  // unit is wei
    // //             gasPrice: '0x09184e72a000', // 10000000000000 wei, which is 0.00001 ether
    // //             gas: '0x7530',              // gas price lowerbound is 21000 
    // //             chainId: '0x4',
    // //             },
    // //         ],
    // //         })
    // //         .then((txHash) => console.log(txHash))
    // //         .catch((error) => console.error);
    // // }
    // // sendTransaction();

    // const web3 = new Web3(Web3.givenProvider)
    // let minABI = [
    // // transfer function on ABI
    // {
    //     "constant": false,
    //     "inputs": [
    //         {
    //             "name": "_to",
    //             "type": "address"
    //         },
    //         {
    //             "name": "_value",
    //             "type": "uint256"
    //         }
    //     ],
    //     "name": "transfer",
    //     "outputs": [
    //         {
    //             "name": "success",
    //             "type": "bool"
    //         }
    //     ],
    //     "payable": false,
    //     "stateMutability": "nonpayable",
    //     "type": "function"
    // }
    // ];

    // // sending custom token through minABI
    // let contractAddress = "0xcADC9b53e03635649ac09Ae71F5A1709a2b51268";
    // let contract = new web3.eth.Contract(minABI, contractAddress);
    // contract.methods.transfer(toAddress, valueToSend_DEC).send({
    //         from: fromAddress
    // });

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
}

// ?????????????????????
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

// ????????????
btnCreateRoom.addEventListener('click', function (e) {
    e.preventDefault()
    const payLoad = {
        "method": "create",
        "clientId": clientId,
        "username": username
    }
    
    ws.send(JSON.stringify(payLoad))
})
// ????????????
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
    if (response.method === "sendcoins"){

        let to_address = response.to

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
        const fromAddress = '0x49169d9aF4f305CC58F46d44fd77D9eDA96E8998'
        //const fromAddress = ethereum.selectedAddress
        const toAddress = to_address
        console.log(fromAddress)
        console.log(to_address)
        const tokenAmountToSend = 50     // unit: 1 token
        const valueToSend_HEX = (tokenAmountToSend*1000000000000000000).toString(16)
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
    // LeadBoard
    if (response.method === "competitors"){
        people.recieveData(response.data)
    }
    // Verify
    if (response.method === "verifyResult"){
        console.log(response);
        if (response.result === "success"){
            registerSuccess()
        }
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
        //console.log(response)
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
        opponentpublickey = response.opponentpublickey
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
