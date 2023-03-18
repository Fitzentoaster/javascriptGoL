//Global Constants
const randomFactor = 8;
const maxGps = 25;
const minGps = 1;

/******************************************************************************
 * State Manager Class: has drawing variables and gamestate boolean
 *****************************************************************************/
class StateManager
{
    isGameActive;
    isGridActive;
    liveColor;
    deadColor;
    canvas;
    ctx;
    gps;
    msWait;
    cellSize;
    rows;
    cols;
    canvasWidth;
    canvasHeight;

    constructor()
    {
        this.canvas = document.getElementById("cellboardcanvas");
        this.ctx = this.canvas.getContext("2d");
        this.liveColor = "AntiqueWhite";
        this.deadColor = "DarkGreen";
        this.isGameActive = false;
        this.isGridActive = false;
        this.msWait = 100;
        this.gps = 10;
        this.cellSize = 5;
        this.canvasWidth = document.documentElement.clientWidth;
        this.canvasWidth = this.canvasWidth / this.cellSize;
        this.canvasWidth = Math.floor(this.canvasWidth) * this.cellSize;
        this.canvasWidth -= 80;
        this.canvasHeight = document.documentElement.clientHeight;
        this.canvasHeight = this.canvasHeight / this.cellSize;
        this.canvasHeight = Math.floor(this.canvasHeight) * this.cellSize;
        this.canvasHeight -= 220;
        this.rows = Math.floor(this.canvasHeight / this.cellSize);
        this.cols = Math.floor(this.canvasWidth / this.cellSize);
    }
}

/******************************************************************************
 * Boards class holds the board and the old board
 *****************************************************************************/
class Boards
{
    boardArray;
    oldBoardArray;
    changedBoardArray;

    constructor(rows, cols) 
    {
        this.boardArray = [];
        this.oldBoardArray = [];
        this.changedBoardArray = [];

        for (let i = 0; i < cols; i++) 
        {
            [this.boardArray[i], this.oldBoardArray[i], this.changedBoardArray[i]] = 
            [new Array(rows), new Array(rows), new Array(rows)];
        }
        for (let i = 0; i < cols; i++)
        {
            for (let j = 0; j < rows; j++)
            {
                this.changedBoardArray[i][j] = true;
            }
        }
    }
}   

/******************************************************************************
 * Registers event listeners to the buttons
 *****************************************************************************/
const listeners = (sm, bd) =>
{  
    document.getElementById("togglestatebutton").addEventListener("click", function () 
    {
        document.getElementById("togglestatebutton").textContent = (sm.isGameActive) ? "Start" : "Stop";
        sm.isGameActive = !sm.isGameActive;
        animLoop(sm, bd);
        toggleButtons(sm);
    });

    document.getElementById("randomizebutton").addEventListener("click", function ()
    {
        randomizeBoard(sm, bd);
        clearCanvas(sm);
        drawBoard(sm, bd);
    });

    document.getElementById("clearbutton").addEventListener("click", function ()
    {
        clearBoard(sm, bd);
        clearCanvas(sm);
        drawBoard(sm, bd);
    });

    document.getElementById("cellboardcanvas").addEventListener("mousedown", function (e)
    {
        if (!sm.isGameActive)
        {
            captureClick(e, sm, bd);
            drawBoard(sm, bd);
            drawGrid(sm, bd);
        }
    });

    document.getElementById("livecolorselect").addEventListener("change", function ()
    {
        sm.liveColor = document.getElementById("livecolorselect").value;
        redrawBoard(sm, bd);
    });

    document.getElementById("deadcolorselect").addEventListener("change", function ()
    {
        sm.deadColor = document.getElementById("deadcolorselect").value;
        redrawBoard(sm, bd);
    });

    document.getElementById("togglegridbutton").addEventListener("click", function ()
    {
        sm.isGridActive = !sm.isGridActive;
        drawGrid(sm);
    });

    document.getElementById("speedupbutton").addEventListener("click", function ()
    {
        speedUp(sm);
        document.getElementById("gpsvalue").value = sm.gps + "GPS";
    });

    document.getElementById("speeddownbutton").addEventListener("click", function ()
    {
        speedDown(sm);
        document.getElementById("gpsvalue").value = sm.gps + "GPS";
    });

    document.getElementById("sizeupbutton").addEventListener("click", function ()
    {
        sizeUp(sm, bd);
        drawGrid(sm);
        document.getElementById("sizevalue").value = sm.cellSize + "PX";
    });

    document.getElementById("sizedownbutton").addEventListener("click", function ()
    {
        sizeDown(sm, bd);
        drawGrid(sm);
        document.getElementById("sizevalue").value = sm.cellSize + "PX";
    });

    window.addEventListener("resize", function () 
    {
        sm.canvasWidth = document.documentElement.clientWidth;
        sm.canvasWidth = sm.canvasWidth / sm.cellSize;
        sm.canvasWidth = Math.floor(sm.canvasWidth) * sm.cellSize - 80;
        sm.canvasHeight = document.documentElement.clientHeight - 220;
        sm.canvasHeight = sm.canvasHeight / sm.cellSize;
        sm.canvasHeight = Math.floor(sm.canvasHeight) * sm.cellSize;
        sm.rows = Math.floor(sm.canvasHeight / sm.cellSize);
        sm.cols = Math.floor(sm.canvasWidth / sm.cellSize);
        resizeCanvas(sm);
        bd = new Boards(sm.rows, sm.cols);
        clearBoard(sm, bd);
        redrawBoard(sm, bd);
    });
}

/******************************************************************************
 * Draws the board to the canvas
 *****************************************************************************/
const drawBoard = (sm, bd) =>
{
    sm.ctx.clearRect(0, 0, sm.canvasWidth, sm.canvasHeight);
    for (let i = 0; i < sm.cols; i++)
    {
        for (let j = 0; j < sm.rows; j++)
        {
            if (bd.boardArray[i][j])
            {
                sm.ctx.fillStyle = sm.liveColor;
            }
            else
            {
                sm.ctx.fillStyle = sm.deadColor;
            }
            sm.ctx.fillRect(i * sm.cellSize, j * sm.cellSize, sm.cellSize, sm.cellSize);
            
        }
    }
}

/******************************************************************************
 * Sets the canvas to all 'dead' cells
 *****************************************************************************/
const clearCanvas = (sm) =>
{
    sm.ctx.clearRect(0, 0, sm.canvasWidth, sm.canvasHeight);
}

/******************************************************************************
 * Clears the board state
 *****************************************************************************/
const clearBoard = (sm, bd) =>
{
    for (let i = 0; i < sm.cols; i++)
    {
        for (let j = 0; j < sm.rows; j++)
        {
            bd.boardArray[i][j] = false;
            bd.oldBoardArray[i][j] = false;
            bd.changedBoardArray[i][j] = true;
        }
    }
}

/******************************************************************************
 * Updates the board to the next generation state
 *****************************************************************************/
const updateBoard = (sm, bd) =>
{
    copyArrays(bd);
    for (let i = 0; i < sm.cols; i++)
    {
        for (let j = 0; j < sm.rows; j++)
        {
            if (bd.oldBoardArray[i][j])
            {
                bd.boardArray[i][j] = testLiveCell(sm, bd, i, j);
            }
            else
            {
                bd.boardArray[i][j] = testDeadCell(sm, bd, i, j);
            }

            if (bd.oldBoardArray[i][j] === bd.boardArray[i][j])
            {
                bd.changedBoardArray[i][j] = false;
            }
            else
            {
                bd.changedBoardArray[i][j] = true;
            }
        }
    }
}

/******************************************************************************
 * Tests a living cell to see if it survives to the next generation
 *****************************************************************************/
const testLiveCell = (sm, bd, x, y) =>
{
    let neighbors = countNeighbors(sm, bd, x, y);
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
const testDeadCell = (sm, bd, x, y) =>
{
    let neighbors = countNeighbors(sm, bd, x, y);
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
const copyArrays = (bd) =>
{
    bd.oldBoardArray = bd.boardArray.map(inner => inner.slice())
}

/******************************************************************************
 * Counts the number of live neighbors of a given cell by coordinates
 * 
 * @param x The x value of the given cell to check
 * @param y The y value of the given cell to check
 * 
 * @return The number of live neighbors of the cell
 *****************************************************************************/
const countNeighbors = (sm, bd, x, y) =>
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

                testX = wrap(testX, sm.cols);
                testY = wrap(testY, sm.rows);

                if (bd.oldBoardArray[testX][testY])
                {
                    liveNeighbors++;
                }
            }
        }
    }
    return liveNeighbors;
}

/******************************************************************************
 * Wraps coordinate around the board
 *****************************************************************************/
const wrap = (coord, max) =>
{
    if (coord < 0) {return max - 1;}
    if (coord > max - 1) {return 0;}
    return coord;
}

/******************************************************************************
 * Randomizes board
 *****************************************************************************/
const randomizeBoard = (sm, bd) =>
{
    for (let i = 0; i < sm.cols; i++)
    {
        for (let j = 0; j < sm.rows; j++)
        {
            bd.boardArray[i][j] = (Math.floor(Math.random() * randomFactor) === 1 ? true: false);
            bd.changedBoardArray[i][j] = true;
        }
    }
    copyArrays(bd);
}

/******************************************************************************
 * Update the board, then draw it function
 *****************************************************************************/
const updateAndDraw = (sm, bd) =>
{
    updateBoard(sm, bd);
    copyArrays(bd);
    drawBoard(sm, bd);
    drawGrid(sm, bd);
}

/******************************************************************************
 * Starts and stops the animation loop
 *****************************************************************************/
const animLoop = (sm, bd) =>
{
    if (sm.isGameActive)
    {
        boardInterval = setInterval(() => updateAndDraw(sm, bd), sm.msWait);
    }
    else
    {
        clearInterval(boardInterval);
    }
}


/******************************************************************************
 * Capture click on the canvas then call Toggle Cell
 *****************************************************************************/
const captureClick = (e, sm, bd) =>
{
    let canvasRect = sm.canvas.getBoundingClientRect();
    let x = e.clientX - canvasRect.left;
    let y = e.clientY - canvasRect.top;
    let i = Math.floor(x / sm.cellSize);
    let j = Math.floor(y / sm.cellSize);
    toggleCell(i, j, bd);
}

/******************************************************************************
 * Toggle cell on and off based on x and y values passed in
 *****************************************************************************/
const toggleCell = (x, y, bd) =>
{
    bd.boardArray[x][y] = !bd.boardArray[x][y];
    bd.oldBoardArray[x][y] = !bd.oldBoardArray[x][y];
    bd.changedBoardArray[x][y] = true;
}

/******************************************************************************
 * Set changedArray to true to redraw whole board on next generation
 *****************************************************************************/
const redrawBoard = (sm, bd) =>
{
    for (let i = 0; i < sm.cols; i++)
    {
        for (let j = 0; j < sm.rows; j++)
        {
            bd.changedBoardArray[i][j] = true;
        }
    }
    drawBoard(sm, bd);
}

/******************************************************************************
 * Draws the grid overlay if active
 *****************************************************************************/
const drawGrid = (sm) =>
{
    sm.ctx.beginPath();
    sm.ctx.strokeStyle = (sm.isGridActive ? "Black" : sm.deadColor);

    for (let i = 0; i < sm.canvasWidth; i += sm.cellSize)
    {
        if (i < sm.canvasWidth)
        {
            sm.ctx.beginPath();
            sm.ctx.moveTo(i, 0);
            sm.ctx.lineTo(i, sm.canvasHeight);
            sm.ctx.stroke();
        }
    }

    for (let i = 0; i < sm.canvasHeight; i += sm.cellSize)
    {
        if (i < sm.canvasHeight)
        {
            sm.ctx.beginPath();
            sm.ctx.moveTo(0, i);
            sm.ctx.lineTo(sm.canvasWidth, i);
            sm.ctx.stroke();
        }
    }

}

/******************************************************************************
 * Speedup Callback Function: increase speed factor
 *****************************************************************************/
const speedUp = (sm) =>
{
    sm.gps += 1;
    if (sm.gps > maxGps)
    {
        sm.gps = maxGps;
    }
    sm.msWait = 1000 / sm.gps;
}

/******************************************************************************
 * Speeddown Callback function: decrease speed factor
 *****************************************************************************/
const speedDown = (sm) =>
{
    sm.gps -= 1;
    if (sm.gps < minGps)
    {
        sm.gps = minGps;
    }
    sm.msWait = 1000 / sm.gps;
}

/******************************************************************************
 * Alter cell size: increase cell size
 *****************************************************************************/
const sizeUp = (sm, bd) =>
{
    switch (sm.cellSize)
    {
        case 5:
            sm.cellSize = 10;
            break;
        case 10:
            sm.cellSize = 20;
            break;
        case 20:
            sm.cellSize = 40;
            break;
        case 40:
            sm.cellSize = 40;
            break;
    }
    resizeCanvas(sm);
    sm.rows = Math.floor(sm.canvasHeight / sm.cellSize);
    sm.cols = Math.floor(sm.canvasWidth / sm.cellSize);
    clearCanvas(sm);
    bd = new Boards(sm.rows, sm.cols);
    clearBoard(sm, bd);
    redrawBoard(sm, bd);
}

/******************************************************************************
 * Alter cell size: decrease cell size
 *****************************************************************************/
const sizeDown = (sm, bd) =>
{
    switch (sm.cellSize)
    {
        case 40:
            sm.cellSize = 20;
            break;
        case 20:
            sm.cellSize = 10;
            break;
        case 10:
            sm.cellSize = 5;
            break;
        case 5:
            sm.cellSize = 5;
            break;
    }
    resizeCanvas(sm);
    sm.rows = Math.floor(sm.canvasHeight / sm.cellSize);
    sm.cols = Math.floor(sm.canvasWidth / sm.cellSize);
    clearCanvas(sm);
    bd = new Boards(sm.rows, sm.cols);
    clearBoard(sm, bd);
    redrawBoard(sm, bd);
}

/******************************************************************************
 * Toggle speed and size buttons on and off depending on whether or not 
 * the simulation is running
 *****************************************************************************/
const toggleButtons = (sm) =>
{
    if (sm.isGameActive)
    {
        document.getElementById("speedupbutton").disabled = true;
        document.getElementById("speeddownbutton").disabled = true;
        document.getElementById("sizeupbutton").disabled = true;
        document.getElementById("sizedownbutton").disabled = true;
        document.getElementById("clearbutton").disabled = true;
    }
    else
    {
        document.getElementById("speedupbutton").disabled = false;
        document.getElementById("speeddownbutton").disabled = false;
        document.getElementById("sizeupbutton").disabled = false;
        document.getElementById("sizedownbutton").disabled = false;
        document.getElementById("clearbutton").disabled = false;
    }
}

/******************************************************************************
 * Resize the canvas element to the new dimensions in the StateManager
 *****************************************************************************/
const resizeCanvas = (sm) =>
{
    document.getElementById("cellboardcanvas").width = sm.canvasWidth;
    document.getElementById("cellboardcanvas").height = sm.canvasHeight;
}

// Main code to run on load
sm = new StateManager;
resizeCanvas(sm);
bd = new Boards(sm.rows, sm.cols);
redrawBoard(sm, bd);
listeners(sm, bd);
