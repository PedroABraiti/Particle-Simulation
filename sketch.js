function make2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
    for (let j = 0; j < arr[i].length; j++) {
      arr[i][j] = 0;
    }
  }
  return arr;
}

//A FAZER
//stone, oil, waterVapor, ice;
//agua apaga fogo -> ambos somem e no lugar da agua vira vapor

let grid;
let w = 4; //pixel size
let cols, rows;

let hueValue;

//Materials
let notTangible = [0];
let isLiquid = [220];
let isAcid = [120];
let isSandy = [40, 50, 60];
let isWood = [15, 18, 21];
let isGas = [35];
let isFire = [10, 20, 30]

//Behavior of materials
let isSinkable = [...isSandy];
let isFlamable = [[...isWood, 30], [...isGas, 80],[...isSandy, 30]]; //material + chance of getting on fire
let isFragile = [...isWood, ...isGas, ...isSandy, ...isLiquid];

let materialsList = [
  isSandy,
  isLiquid,
  isAcid,
  isWood,
  isGas,
  isFire
];

let materialID = 0; // Mova a declaração para fora da função para manter o estado
let chosenMaterial = materialsList[materialID]; // Variável para armazenar o material escolhido

let size = 1;
let mouseHolded = false;

function setup() {
  createCanvas(400*2, 300*2);
  colorMode(HSB, 360, 255, 255); // hue, saturation, brightness
  cols = width / w;
  rows = height / w;
  grid = make2DArray(cols, rows);
}

window.addEventListener('wheel', function(event) {
  if (event.deltaY > 0) {
    size -= 1; // Scroll down, decrease the variable
  } else {
    size += 1; // Scroll up, increase the variable
  }

  size = constrain(size, 1, 8); // Limit the value between 1 and 8
});

function mousePressed() {
  mouseHolded = true;
}
function mouseReleased(){
  mouseHolded = false;
}

function keyPressed() {
  if (key === ' ') {
    isPaused = !isPaused; // Alterna entre pausado e não pausado
  }
  if (key >= '1' && key <= materialsList.length) {
    materialID = int(key) - 1; // Converte a tecla para um índice (0, 1, 2)
    chosenMaterial = materialsList[materialID]; // Atualiza o material escolhido
  }
}

let fps = 60; // Desired FPS
let isPaused = false;
let frameTime = 1000 / fps; // Time per frame in milliseconds
let lastFrameTime = 0;

function draw() {
  let currentTime = millis();

  // Se estiver pausado, ainda desenhe o grid
  background(0);

  if (mouseHolded) {
    let mouseCol = floor(mouseX / w);
    let mouseRow = floor(mouseY / w);
  
    let radius = size - 1; // Usando `size` como raio
    let extent = floor(radius); // Extensão
  
    if (mouseButton === LEFT) {
      for (let i = -extent; i <= extent; i++) {
        for (let j = -extent; j <= extent; j++) {
          let col = mouseCol + i;
          let row = mouseRow + j;
          // Calcular a distância da célula (col, row) até o centro (mouseCol, mouseRow)
          let distToMouse = Math.sqrt(i ** 2 + j ** 2);
          
          // Verificar se a célula está dentro do círculo
          if (distToMouse <= radius) {
            if (col >= 0 && col < cols && row >= 0 && row < rows) { // Verifica se está dentro da grid
              if (notTangible.includes(grid[col][row])) {
                let randomValue = random(chosenMaterial);
                grid[col][row] = randomValue; // Atribui valor aleatório
              }
            }
          }
        }
      }
    } else if (mouseButton === CENTER) {
      for (let i = -extent; i <= extent; i++) {
        for (let j = -extent; j <= extent; j++) {
          let col = mouseCol + i;
          let row = mouseRow + j;
          // Calcular a distância da célula (col, row) até o centro (mouseCol, mouseRow)
          let distToMouse = Math.sqrt(i ** 2 + j ** 2);
          
          // Verificar se a célula está dentro do círculo
          if (distToMouse <= radius) {
            if (col >= 0 && col < cols && row >= 0 && row < rows) { // Verifica se está dentro da grid
              grid[col][row] = 0; // Limpa a célula
            }
          }
        }
      }
    } 
  }

  

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      noStroke();
      if (grid[i][j] > 0) {
        fill(grid[i][j], 255, 255);
        let x = i * w;
        let y = j * w;
        square(x, y, w);
      }
    }
  }

  if (!isPaused) {
    // Atualiza a lógica do jogo apenas quando não está pausado
    if (currentTime - lastFrameTime >= frameTime) {
      lastFrameTime = currentTime; // Atualiza o tempo do último frame

      let isUpdated = new Set();
      let nextGrid = make2DArray(cols, rows);


      nextGrid = grid; //nextGrid se iguala a gris antes de percorrer uma atualização completa de quadro

      for (let j = rows - 1; j >= 0; j--) { // Percorre de baixo para cima
        let randomDirection = Math.random() < 0.5; // true ou false aleatoriamente
        let start = randomDirection ? 0 : cols - 1;
        let end = randomDirection ? cols : -1;
        let step = randomDirection ? 1 : -1;
        for (let i = start; i !== end; i += step) {    //alterna entre ir da esquerda para a direita aleatoriamente
          let state = grid[i][j];
          let below = grid[i][j + 1];
          let above = grid[i][j - 1];
          let moveR, moveL, belowR, belowL, aboveR, aboveL;
          let possibleMoves = []; // Inicializa possibleMoves como um array vazio
          let possibleCorosion = [];
          let possibleFire = [];

          if (!isUpdated.has(`${i},${j}`)){ //só passa pelas celulas da grid que ainda não sofreram update nesse frame
            if (i > 0) {
              moveL = grid[i - 1][j];
              if (j < rows - 1) {
                belowL = grid[i - 1][j + 1];
              }
              if (j > 0) {
                aboveL = grid[i - 1][j - 1];
              }
            }
            if (i < cols - 1) {
              moveR = grid[i + 1][j];
              if (j < rows - 1) {
                belowR = grid[i + 1][j + 1];
              }
              if (j > 0) {
                aboveR = grid[i + 1][j - 1];
              }
            }
            //SAND
            if (isSandy.includes(state)) { // Movimento de sólidos (areia)
              if (notTangible.includes(below) && j < rows - 1) {
                possibleMoves.push([i, j + 1]);
              }
              if (notTangible.includes(belowR)) {
                possibleMoves.push([i + 1, j + 1]);
              }
              if (notTangible.includes(belowL)) {
                possibleMoves.push([i - 1, j + 1]);
              }
              if (possibleMoves.length === 0) {
                if (isLiquid.includes(below) && j < rows - 1) {
                  possibleMoves.push([i, j + 1]);
                }
                if (isLiquid.includes(belowR)) {
                  possibleMoves.push([i + 1, j + 1]);
                }
                if (isLiquid.includes(belowL)) {
                  possibleMoves.push([i - 1, j + 1]);
                }
                if (possibleMoves.length === 0){
                  nextGrid[i][j].isUpdated = true;
                }
                else {
                  let sinkChance = 20; //chance in % of particle sinking
                  if (int(random(1, 101)) <= sinkChance){
                    let rn = Math.floor(Math.random() * possibleMoves.length);
                    let [newI, newJ] = possibleMoves[rn]; //water pixel
                    x = nextGrid[newI][newJ]; //x = water
                    nextGrid[newI][newJ] = nextGrid[i][j]; //water pixel turned to sand
                    nextGrid[i][j] = x;
                    nextGrid[newI][newJ].isUpdated = true;
                    nextGrid[i][j].isUpdated = true;
                  }
                  else{
                    nextGrid[i][j].isUpdated = true;
                  }
                }
              } else {
                let rn = Math.floor(Math.random() * possibleMoves.length);
                let [newI, newJ] = possibleMoves[rn];
                nextGrid[newI][newJ] = nextGrid[i][j];
                nextGrid[newI][newJ].isUpdated = true;
                nextGrid[i][j] = 0; // Limpa a célula original
              }
            } 
            //LIQUID
            else if (isLiquid.includes(state)) { // Movimento de líquidos (água)
              if (notTangible.includes(below) && j < rows - 1) {
                possibleMoves.push([i, j + 1]);
              }
              if (notTangible.includes(belowR)) {
                possibleMoves.push([i + 1, j + 1]);
              }
              if (notTangible.includes(belowL)) {
                possibleMoves.push([i - 1, j + 1]);
              }
              if (notTangible.includes(moveR)) {
                possibleMoves.push([i + 1, j]);
              }
              if (notTangible.includes(moveL)) {
                possibleMoves.push([i - 1, j]);
              }
  
              // Verifica se possibleMoves contém qualquer um dos movimentos 'below'
              const containsBelow = possibleMoves.some(move => 
                (move[0] === i && move[1] === j + 1) || 
                (move[0] === i + 1 && move[1] === j + 1) || 
                (move[0] === i - 1 && move[1] === j + 1)
              );
  
              if (containsBelow) {
                // Remove movimentos laterais de possibleMoves
                possibleMoves = possibleMoves.filter(move => 
                  !(move[0] === i + 1 && move[1] === j) && 
                  !(move[0] === i - 1 && move[1] === j)
                );
              }
  
              if (possibleMoves.length === 0) {
                nextGrid[i][j].isUpdated = true;
              } else {
                let rn = Math.floor(Math.random() * possibleMoves.length);
                let [newI, newJ] = possibleMoves[rn];
                nextGrid[newI][newJ] = nextGrid[i][j];
                nextGrid[newI][newJ].isUpdated = true;
                nextGrid[i][j] = 0; // Limpa a célula original
              }
            }
            //ACID
            else if (isAcid.includes(state)) { // Movimento de líquidos
              if (notTangible.includes(below) && j < rows - 1) {
                possibleMoves.push([i, j + 1]);
              } else if (isFragile.includes(below) && j < rows - 1) {
                possibleCorosion.push([i, j + 1]);
              }
              if (notTangible.includes(belowR)) {
                possibleMoves.push([i + 1, j + 1]);
              }
              if (notTangible.includes(belowL)) {
                possibleMoves.push([i - 1, j + 1]);
              }
              if (notTangible.includes(moveR)) {
                possibleMoves.push([i + 1, j]);
              } else if (isFragile.includes(moveR)) {
                possibleCorosion.push([i + 1, j]);
              }
              if (notTangible.includes(moveL)) {
                possibleMoves.push([i - 1, j]);
              } else if (isFragile.includes(moveL)) {
                possibleCorosion.push([i - 1, j]);
              }
              if (isFragile.includes(above) && j > 0){
                possibleCorosion.push([i, j - 1]);
              }
  
              // Verifica se possibleMoves contém qualquer um dos movimentos 'below'
              const containsBelow = possibleMoves.some(move => 
                (move[0] === i && move[1] === j + 1) || 
                (move[0] === i + 1 && move[1] === j + 1) || 
                (move[0] === i - 1 && move[1] === j + 1)
              );

              const fragileBelow = possibleCorosion.some(move => 
                (move[0] === i && move[1] === j + 1)
              );
  
              if (containsBelow) {
                // Remove movimentos laterais de possibleMoves
                possibleMoves = possibleMoves.filter(move => 
                  !(move[0] === i + 1 && move[1] === j) && 
                  !(move[0] === i - 1 && move[1] === j)
                );
              }
              if (fragileBelow) {
                // Remove movimentos laterais de possibleMoves
                possibleCorosion = possibleCorosion.filter(move => 
                  !(move[0] === i + 1 && move[1] === j) && 
                  !(move[0] === i - 1 && move[1] === j) &&
                  !(move[0] === i && move[1] === j - 1)
                );
                possibleMoves == [];
              }
  
              if (possibleMoves.length === 0 && possibleCorosion.length === 0) {
                nextGrid[i][j].isUpdated = true;
              } else {
                if (possibleMoves.length !== 0 && possibleCorosion.length !== 0){
                  if (int(random(1, 3)) == 1){ //movimento normal
                    let rn = Math.floor(Math.random() * possibleMoves.length);
                    let [newI, newJ] = possibleMoves[rn];
                    nextGrid[newI][newJ] = nextGrid[i][j];
                    nextGrid[newI][newJ].isUpdated = true;
                    nextGrid[i][j] = 0; // Limpa a célula original
                  }
                  else{ //movimento para consumir pixel
                    let rn = Math.floor(Math.random() * possibleCorosion.length);
                    let [newI, newJ] = possibleCorosion[rn];
                    nextGrid[newI][newJ] = 0;
                    nextGrid[i][j] = 0;
                  }
                }
                else if (possibleMoves.length !== 0){
                  let rn = Math.floor(Math.random() * possibleMoves.length);
                  let [newI, newJ] = possibleMoves[rn];
                  nextGrid[newI][newJ] = nextGrid[i][j];
                  nextGrid[newI][newJ].isUpdated = true;
                  nextGrid[i][j] = 0; // Limpa a célula original
                }
                else if (possibleCorosion.length !== 0){
                  let rn = Math.floor(Math.random() * possibleCorosion.length);
                  let [newI, newJ] = possibleCorosion[rn];
                  nextGrid[newI][newJ] = 0;
                  nextGrid[i][j] = 0;
                }
              }
            }
            //GASES
            else if (isGas.includes(state)){
              let stayChance = 50; //chance in % of particle to not move
              if (int(random(1, 101)) <= stayChance){
                isUpdated.add(`${i},${j}`);
              }
              else{
                if (notTangible.includes(above) && j > 0) {
                  possibleMoves.push([i, j - 1]);
                }
                if (notTangible.includes(aboveR)) {
                  possibleMoves.push([i + 1, j - 1]);
                }
                if (notTangible.includes(aboveL)) {
                  possibleMoves.push([i - 1, j - 1]);
                }
                if (notTangible.includes(moveR)) {
                  possibleMoves.push([i + 1, j]);
                }
                if (notTangible.includes(moveL)) {
                  possibleMoves.push([i - 1, j]);
                }
                if (notTangible.includes(below)) {
                  possibleMoves.push([i, j + 1]);
                }


                // Limite o número de movimentos permitidos por quadro
                if (possibleMoves.length > 0) {
                  let rn = Math.floor(Math.random() * possibleMoves.length);
                  let [newI, newJ] = possibleMoves[rn];
                  nextGrid[newI][newJ] = nextGrid[i][j];
                  isUpdated.add(`${newI},${newJ}`);
                  nextGrid[i][j] = 0; // Limpa a célula original
                } else {
                  isUpdated.add(`${i},${j}`);
                }
              }
            }
            //FIRE
            else if (isFire.includes(state)) {
              let dieChance = 5; // chance in % of particle to not move
              let stayChance = 20; // chance in % of particle to not move
              if (int(random(1, 101)) <= dieChance) {
                nextGrid[i][j] = 0;
              }
              else{
                // Verifica as células vizinhas que podem pegar fogo
              if (isFlamable.some(flammable => flammable.slice(0, -1).includes(moveL))) {
                possibleFire.push([i - 1, j]); // Célula à esquerda
              }
              if (isFlamable.some(flammable => flammable.slice(0, -1).includes(moveR))) {
                possibleFire.push([i + 1, j]); // Célula à direita
              }
              if (isFlamable.some(flammable => flammable.slice(0, -1).includes(above))) {
                possibleFire.push([i, j - 1]); // Célula acima
              }
              if (isFlamable.some(flammable => flammable.slice(0, -1).includes(below))) {
                possibleFire.push([i, j + 1]); // Célula abaixo
              }
            
              // Propagação do fogo
              if (possibleFire.length > 0) {
                possibleFire.forEach(([newI, newJ]) => {
                  let flameChance = 0;
            
                  isFlamable.forEach(flammable => {
                    if (flammable.slice(0, -1).includes(nextGrid[newI][newJ])) {
                      flameChance = flammable[flammable.length - 1]; // Chance do material
                    }
                  });
            
                  // Checar se o fogo deve se propagar
                  if (int(random(1, 101)) <= flameChance) {
                    nextGrid[newI][newJ] = random(isFire); // Propaga o fogo
                    isUpdated.add(`${newI},${newJ}`);
                  }
                });
              }
              } if (int(random(1, 101)) <= stayChance) {
                isUpdated.add(`${i},${j}`);
              } else {
                // Adiciona possíveis movimentos
                if (notTangible.includes(above) && j > 0) {
                  possibleMoves.push([i, j - 1]);
                }
                if (notTangible.includes(aboveR)) {
                  possibleMoves.push([i + 1, j - 1]);
                }
                if (notTangible.includes(aboveL)) {
                  possibleMoves.push([i - 1, j - 1]);
                }
                if (notTangible.includes(moveR)) {
                  possibleMoves.push([i + 1, j]);
                }
                if (notTangible.includes(moveL)) {
                  possibleMoves.push([i - 1, j]);
                }
            
                // Limite o número de movimentos permitidos por quadro
                if (possibleMoves.length > 0) {
                  let rn = Math.floor(Math.random() * possibleMoves.length);
                  let [newI, newJ] = possibleMoves[rn];
                  nextGrid[newI][newJ] = nextGrid[i][j];
                  isUpdated.add(`${newI},${newJ}`);
                  nextGrid[i][j] = 0; // Limpa a célula original
                } else {
                  isUpdated.add(`${i},${j}`);
                }
              }
              isUpdated.add(`${i},${j}`); // Adiciona a célula atual
            }
            
          }
          else{ //caso a celula deva ser ignorada
            isUpdated.add(`${i},${j}`);
          }
        }
      }
      grid = nextGrid; // Atualiza o grid
      isUpdated.clear();
    }
  }
}