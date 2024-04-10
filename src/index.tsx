import React from "react";
import ReactDOM from "react-dom/client";
import { Board } from "./ui/board";
import { BoardState } from "./logic/BoardState";
import { Card, CardPosition } from "./logic/Card";

import "./index.css";

const board = new BoardState(4, 13);

async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function Index() {
    const [rows, setRows] = React.useState(4);
    const [columns, setColumns] = React.useState(13);
    const [selectedCard, setSelectedCard] = React.useState<CardPosition | null>(
        null
    );
    const [moveableCards, setMoveableCards] = React.useState<CardPosition[]>(
        []
    );
    const [possibleGaps, setPossibleGaps] = React.useState<CardPosition[]>([]);
    const [state, setState] = React.useState(board.state);
    const [verifyValidMove, setVerifyValidMove] = React.useState<boolean>(false);
    const [seed, setSeed] = React.useState(board.computeSeed());

    function resetHand() {
        setMoveableCards(board.getMoveableCards().map(({from}) => from));
        setPossibleGaps([]);
        setSelectedCard(null);
    }

    React.useEffect(() => {
        board.onUpdate = () => {
            setState([...board.state]);
            setSeed(board.computeSeed());
            setRows(board.rows);
            setColumns(board.columns);
            resetHand();
        };
    }, []);

    // 4.4 3.0 3.2 1.0 x.x 0.1 x.x 1.1 2.0 3.1 2.2 x.x 0.0 1.2 2.1 0.2 x.x
    async function performAStar() {
        const size = board.rows * board.columns;
        const path = await board.aStar((bs) => {
            const functions = [
                size - bs.getWellPlacedCards().length,
                bs.getStuckGaps().length,
                bs.getDoubleGaps().length
            ]
            const weights = [1, 1, 1];
            return functions.reduce((acc, val, idx) => acc + val * weights[idx], 0);
        });
        console.log(path);
        for (const p of path) {
            board.load(p);
            await wait(500);
        }
    }

    function loadSeed() {
        const seedElement = document.getElementById("seed") as HTMLInputElement;
        board.loadSeed(seedElement.value);
    }

    function initializeBoard() {
        board.reset(rows, columns);
        board.removeHighestCards();
    }

    function shuffleBoard() {
        board.shuffle();
    }

    function performMove(from: CardPosition, to: CardPosition) {
        board.requestMove(from, to, verifyValidMove);
    }

    function handleCardSelect(card: Card | null, position: CardPosition) {
        if (card === null) {
            performMove(selectedCard!, position);
            return;
        }

        if (
            position.row === selectedCard?.row &&
            position.column === selectedCard?.column
        ) {
            resetHand();
            return;
        }

        setSelectedCard({ row: position.row, column: position.column });
        setMoveableCards([]);
        setPossibleGaps(board.getCandidateGaps(position));

        console.log(
            `selected card: ${card?.rank} of ${card?.suit} from row ${position.row} and column ${position.column}`
        );
    }

    React.useEffect(() => {
        initializeBoard();
    }, [rows, columns]);

    return (
        <div>
            <div>
                <p>{seed}</p>
            </div>
            <Board
                state={state}
                rows={rows}
                columns={columns}
                moveableCards={moveableCards}
                possibleGaps={possibleGaps}
                selectedCard={selectedCard}
                handleCardSelect={handleCardSelect}
            />
            <div>
                <button onClick={initializeBoard}>Reset</button>
                <button onClick={shuffleBoard}>Shuffle</button>
                <button onClick={performAStar}>A*</button>
                <button onClick={() => console.log(board.getChildren())}>Console log children</button>
                <div>
                    <div>
                        <input
                            type="checkbox"
                            checked={verifyValidMove}
                            onChange={(e) => setVerifyValidMove(e.target.checked)}
                        />
                        <label>Verify valid move</label>
                    </div>

                    <div>
                        <input
                            type="number"
                            value={rows}
                            onChange={(e) => setRows(Number(e.target.value))}
                        />
                    </div>

                    <div>
                        <input
                            type="number"
                            value={columns}
                            onChange={(e) => setColumns(Number(e.target.value))}
                        />
                    </div>

                    <div>
                        <input type="text" id="seed"/>
                        <button onClick={loadSeed}>Load seed</button>
                    </div>
                </div>
            </div>

            {/* <hr/>

            <span style={{ opacity: .5 }}>
                <Board
                    state={state}
                    rows={rows}
                    columns={columns}
                    moveableCards={moveableCards}
                    possibleGaps={possibleGaps}
                    selectedCard={selectedCard}
                />
            </span> */}
        </div>
    );
}

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);

root.render(
    <React.StrictMode>
        <Index />
    </React.StrictMode>
);
