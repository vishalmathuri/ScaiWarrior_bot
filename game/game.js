let score = 0

function tap(){

 score++

 document.getElementById("score").innerText = "Score: " + score

}

function submitScore(){

 TelegramGameProxy.shareScore(score)

}