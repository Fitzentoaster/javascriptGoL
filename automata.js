// Global Constants
const cellsize = 2;
const rows = 500/cellsize;
const cols = 500/cellsize;
const randomFactor = 8;
const msWait = 100;
const aliveColor = "white";
const deadColor = "#1a3d24";

// Global variables
let isGameActive = false;
let boardArray = new Array(rows);
let oldBoardArray = new Array(rows);
let canvas = document.getElementById("cellboardcanvas");
let ctx = canvas.getContext("2d");

/******************************************************************************
 * Registers event listeners to the buttons
 *****************************************************************************/
const listeners = () =>
{  
    document.getElementById("togglestatebutton").addEventListener("click", function () 
    {
        document.getElementById("togglestatebutton").textContent = (isGameActive) ? "Start" : "Stop";
        toggleState();
        animLoop();
    });

    document.getElementById("randomizebutton").addEventListener("click", function ()
    {
        randomizeBoard();
        drawBoard();
    });
}

/******************************************************************************
 * Initializes board arrays
 *****************************************************************************/
const initBoard = () =>
{
    for (let i = 0; i < rows; i++)
    {
        boardArray[i] = new Array(cols);
        oldBoardArray[i] = new Array(cols);
    }
    
    let rowToPush = [];
    for (let i = 0; i < rows; i++)
    {
        rowToPush.push(false);
    }
    
    for (let i = 0; i < cols; i++)
    {
        boardArray.push(rowToPush);
        oldBoardArray.push(rowToPush);
    }
}

/******************************************************************************
 * Toggles game state
 *****************************************************************************/
const toggleState = () =>
{
    isGameActive = !isGameActive;
}

/******************************************************************************
 * Draws the board to the canvas
 *****************************************************************************/
const drawBoard = () =>
{
    for(let i = 0; i < rows; i++)
    {
        for (let j = 0; j < cols; j++)
        {
            if (boardArray[i][j])
            {
                ctx.fillStyle = aliveColor;
            }
            else
            {
                ctx.fillStyle = deadColor;
            }
            ctx.fillRect(i*cellsize, j*cellsize, cellsize, cellsize);
        }
    }
}

/******************************************************************************
 * Updates the board to the next generation state
 *****************************************************************************/
const updateBoard = () =>
{
    copyArrays();
    for (let i = 0; i < rows; i++)
    {
        for (let j = 0; j < cols; j++)
        {
            if (oldBoardArray[i][j])
            {
                boardArray[i][j] = testLiveCell(i, j);
            }
            else
            {
                boardArray[i][j] = testDeadCell(i, j);
            }
        }
    }
}

/******************************************************************************
 * Tests a living cell to see if it survives to the next generation
 *****************************************************************************/
const testLiveCell = (x, y) =>
{
    let neighbors = countNeighbors(x, y);
    if (neighbors === 2 || neighbors === 3)
    {
        return true;
    }
    else
    {
        return false;
    }
}

/******************************************************************************
 * Tests a dead cell to see if it is born next generation
 *****************************************************************************/
const testDeadCell = (x, y) =>
{
    let neighbors = countNeighbors(x, y);
    if (neighbors === 3)
    {
        return true;
    }
    else
    {
        return false;
    }
}

/******************************************************************************
 * Copies the boardArray to the oldBoardArray
 *****************************************************************************/
const copyArrays = () =>
{
    oldBoardArray = boardArray.map(inner => inner.slice())
}

/******************************************************************************
 * Counts the number of live neighbors of a given cell by coordinates
 * 
 * @param x The x value of the given cell to check
 * @param y The y value of the given cell to check
 * 
 * @return The number of live neighbors of the cell
 *****************************************************************************/
const countNeighbors = (x, y) =>
{
    let liveNeighbors = 0;
    for (let xOffset = -1; xOffset < 2; xOffset++)
    {
        for (let yOffset = -1; yOffset < 2; yOffset++)
        {
            let selfSame = false;
            if (xOffset === 0 && yOffset === 0)
            {
                selfSame = true;
            }
            if (!selfSame)
            {
                let testX = x + xOffset;
                let testY = y + yOffset;

                if (testX < 0) {testX = rows - 1;}
                if (testX > rows - 1) {testX = 0;}
                if (testY < 0) {testY = cols - 1;}
                if (testY > cols - 1) {testY = 0;}
                if (oldBoardArray[testX][testY])
                {
                    liveNeighbors++;
                }
            }
        }
    }
    return liveNeighbors;
}

/******************************************************************************
 * Randomizes board
 *****************************************************************************/
const randomizeBoard = () =>
{
    for (let i = 0; i < rows; i++)
    {
        for (let j = 0; j < cols; j++)
        {
            boardArray[i][j] = (Math.floor(Math.random() * randomFactor) === 1 ? true: false);
        }
    }
    
}

/******************************************************************************
 * Update the board, then draw it function
 *****************************************************************************/
const updateAndDraw = () =>
{
    updateBoard();
    copyArrays();
    drawBoard();
}

/******************************************************************************
 * Starts and stops the animation loop
 *****************************************************************************/
const animLoop = () =>
{
    if (isGameActive)
    {
        boardInterval = setInterval(updateAndDraw, msWait);
    }
    else
    {
        clearInterval(boardInterval);
    }
}

// Main code to run on load
initBoard();
listeners();
