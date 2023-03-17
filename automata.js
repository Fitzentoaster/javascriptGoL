// Global Constants
const cellsize = 10;
const canvasWidth = document.getElementById("cellboardcanvas").clientWidth;
const canvasHeight = document.getElementById("cellboardcanvas").clientHeight;
const rows = canvasWidth/cellsize;
const cols = canvasHeight/cellsize;
const randomFactor = 8;
const msWait = 100;

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
    gridcanvas;
    gridctx;

    constructor()
    {
        this.canvas = document.getElementById("cellboardcanvas");
        this.ctx = this.canvas.getContext("2d");
        this.gridcanvas = document.getElementById("gridboardcanvas");
        this.gridctx = this.gridcanvas.getContext("2d");
        this.liveColor = "WhiteSmoke";
        this.deadColor = "DarkGreen";
        this.isGameActive = false;
        this.isGridActive = false;
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

    constructor() 
    {
        this.boardArray = [];
        this.oldBoardArray = [];
        this.changedBoardArray = [];

        for (let i = 0; i < rows; i++) 
        {
            [this.boardArray[i], this.oldBoardArray[i], this.changedBoardArray[i]] = 
            [new Array(cols), new Array(cols), new Array(cols)];
        }
        for (let i = 0; i < rows; i++)
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
    });

    document.getElementById("randomizebutton").addEventListener("click", function ()
    {
        randomizeBoard(bd);
        clearCanvas(sm);
        drawBoard(sm, bd);
    });

    document.getElementById("cellboardcanvas").addEventListener("mousedown", function (e)
    {
        if (!sm.isGameActive)
        {
            captureClick(e, sm, bd);
            drawBoard(sm, bd);
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
}

/******************************************************************************
 * Draws the board to the canvas
 *****************************************************************************/
const drawBoard = (sm, bd) =>
{
    for (let i = 0; i < rows; i++)
    {
        for (let j = 0; j < cols; j++)
        {
            if (bd.changedBoardArray[i][j])
            {
                if (bd.boardArray[i][j])
                {
                    sm.ctx.fillStyle = sm.liveColor;
                }
                else
                {
                    sm.ctx.fillStyle = sm.deadColor;
                }
                sm.ctx.fillRect(i*cellsize, j*cellsize, cellsize, cellsize);
            }
        }
    }
}

/******************************************************************************
 * Sets the canvas to all 'dead' cells
 *****************************************************************************/
const clearCanvas = (sm) =>
{
    for (let i = 0; i < rows; i++)
    {
        for (let j = 0; j < cols; j++)
        {
            sm.ctx.fillStyle = sm.deadColor;
            sm.ctx.fillRect(i*cellsize, j*cellsize, cellsize, cellsize);
        }
    }
}

/******************************************************************************
 * Updates the board to the next generation state
 *****************************************************************************/
const updateBoard = (bd) =>
{
    copyArrays(bd);
    for (let i = 0; i < rows; i++)
    {
        for (let j = 0; j < cols; j++)
        {
            if (bd.oldBoardArray[i][j])
            {
                bd.boardArray[i][j] = testLiveCell(bd, i, j);
            }
            else
            {
                bd.boardArray[i][j] = testDeadCell(bd, i, j);
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
const testLiveCell = (bd, x, y) =>
{
    let neighbors = countNeighbors(bd, x, y);
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
const testDeadCell = (bd, x, y) =>
{
    let neighbors = countNeighbors(bd, x, y);
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
const countNeighbors = (bd, x, y) =>
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

                testX = wrap(testX, rows);
                testY = wrap(testY, cols);

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
const randomizeBoard = (bd) =>
{
    for (let i = 0; i < rows; i++)
    {
        for (let j = 0; j < cols; j++)
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
    updateBoard(bd);
    copyArrays(bd);
    drawBoard(sm, bd);
}

/******************************************************************************
 * Starts and stops the animation loop
 *****************************************************************************/
const animLoop = (sm, bd) =>
{
    if (sm.isGameActive)
    {
        boardInterval = setInterval(() => updateAndDraw(sm, bd), msWait);
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
    let i = Math.floor(x / cellsize);
    let j = Math.floor(y / cellsize);
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

const redrawBoard = (sm, bd) =>
{
    for (let i = 0; i < rows; i++)
    {
        for (let j = 0; j < cols; j++)
        {
            bd.changedBoardArray[i][j] = true;
        }
    }
    drawBoard(sm, bd);
}

const drawGrid = (sm) =>
{
    sm.gridctx.clearRect(0, 0, canvasWidth, canvasHeight)
    if (sm.isGridActive)
    {
        for (let i = 0; i < canvasWidth; i += cellsize)
        {
            sm.gridctx.moveTo(i, 0);
            sm.gridctx.lineTo(i, canvasHeight);
            sm.gridctx.stroke();
        }

        for (let i = 0; i < canvasHeight; i += cellsize)
        {
            sm.gridctx.moveTo(0, i);
            sm.gridctx.lineTo(canvasWidth, i);
            sm.gridctx.stroke();
        }
    }
}

// Main code to run on load
sm = new StateManager;
bd = new Boards
clearCanvas(sm, bd);
listeners(sm, bd);
