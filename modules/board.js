import Alert from 'react-bootstrap/Alert'
import React from 'react';
import ReactDOM  from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
const allGame = document.querySelector('.bg')
const vsTxt = document.querySelector('.text')
const rankPart = document.getElementById('rank-part')
const question = document.getElementById('ice-breaking')

const iceBreaking = [
    '就讀什麼科系', '平常喜歡做什麼', '最喜歡看的電影'
]


class People{
    constructor(){
        this.challenger = [
            {name: 'Tristan',point: 600}, 
            {name: 'Jasmine',point: 450},
            {name: 'John',point: 353},
            {name: 'Telecom',point: 320},
            {name: 'Elevator',point: 445}]
        this.pbIndex = 0
    }
    init(){
        allGame.style.display = "none"
        vsTxt.style.display = 'none'
        rankPart.style.display = 'inline-block'
        document.body.style.backgroundColor = "#333"
    }
    update(){
        let type;
        this.sortPoints()
        this.renderList = this.challenger.map((variant, idx)=>{
            if (idx <= 2)
                type = "success";
            else
                type = 'dark'
            return <Alert key={idx} variant={type}>
                <h2>{idx + 1}.</h2>{variant.name}
                <h3>{variant.point}</h3>
            </Alert>
        })
        this.render()
    }
    sortPoints(){
        this.challenger = this.challenger.sort((a, b)=>{
            return b.point - a.point;
        })
    }
    render(){
        question.innerText = `破病問題：${iceBreaking[this.pbIndex]}`
        ReactDOM.render(this.renderList, rank)
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

export default People;