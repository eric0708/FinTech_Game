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

export default Timer;