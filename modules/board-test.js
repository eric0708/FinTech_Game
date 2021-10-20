import Alert from 'react-bootstrap/Alert'
import React from 'react';
import ReactDOM  from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
const allGame = document.querySelector('.bg')
const vsTxt = document.querySelector('.text')

class People extends React.Component{
    constructor(props){
        super(props)
        this.state = {challenger: []}
        this.recieveData.bind(this)
    }
    init(){
        allGame.style.display = "none"
        vsTxt.style.display = 'none'
        rank.style.display = "inline-block"
        rankTxt.style.display = "inline-block"
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
        // console.log(this.renderList);
        this.render()
    }
    sortPoints(){
        this.challenger = this.challenger.sort((a, b)=>{
            return b.point - a.point;
        })
    }
    render(){
        return this.challenger.map((variant, idx)=>{
            if (idx <= 2)
                type = "success";
            else
                type = 'dark'
            return <Alert key={idx} variant={type}>
                <h2>{idx + 1}.</h2>{variant.name}
                <h3>{variant.point}</h3>
            </Alert>
        })
        // ReactDOM.render(this.renderList, rank)
    }
    recieveData(data){
        let temp = [];
        for (const [key, value] of Object.entries(data)) {
            temp.push({
                name: key,
                point: value.totalPoints
            })
        }
        this.setState({challenger: temp})
        console.log(this.state);
    }
}

export default People;