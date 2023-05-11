/// Copyright (c) 2023 Oliver Lau <ola@ct.de>, Heise Medien GmbH & Co. KG

const State = {
    PLAYING: 0,
    SOLVING: 1,
};

class Lightsout extends HTMLDivElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.gameState = State.PLAYING;
    }

    redraw() {
        this.shadowRoot.innerHTML = '';
        this.N = this.getAttribute('data-width');
        this.M = this.getAttribute('data-height');
        this.nStates = this.getAttribute('data-states');
        this.buttons = [];
        this.move_count = 0;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
<p id="score">Anzahl Züge: <span id="moves"></span></p>
<p><button id="solve">Lösen</button></p>
`;
        const div = document.createElement('div');
        div.className = 'game';
        for (let j = 0; j < this.M; ++j) {
            for (let i = 0; i < this.N; ++i) {
                const button = document.createElement('button');
                button.setAttribute('data-state', 0);
                button.className = 'light state-0';
                button.addEventListener('click', () => this.onClick(i, j));
                this.buttons.push(button);
                div.appendChild(button);
            }
        }
        wrapper.insertBefore(div, wrapper.querySelector('#score'));
        this.shuffle();
        const style = document.createElement('style');
        style.textContent = `
.game {
    padding: 8px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(${this.N}, 50px);
}

p {
    padding: 2px 8px 2px 8px;
}

button {
    margin: 2px;
    padding: 4px;
    border: 2px solid #eee;
    border-radius: 4px;
    cursor: pointer;
    color: #222;
    min-height: 44px;
}

button.light {
    width: 44px;
    height: 44px;
    color: white;
    font-weight: bold;
    transition: all 450ms ease-in-out;
}

.state-0 {
    background-color: rgb(0, 139, 44) !important;
    transform: rotateX(0deg) rotateY(0deg);
}

.state-1 {
    background-color: rgb(200, 209, 14) !important;
    transform: rotateX(180deg) rotateY(0deg);
}

.state-2 {
    background-color: rgb(203, 46, 77) !important;
    transform: rotateX(180deg) rotateY(180deg);
}

.state-3 {
    background-color: rgb(46, 92, 185) !important;
    transform: rotateX(0deg) rotateY(180deg);
}
`;
        this.shadowRoot.append(style, wrapper);
        this.moves_el = wrapper.querySelector('#moves');
        this.solve_button = wrapper.querySelector('button#solve');
        this.solve_button.addEventListener('click', () => this.solve());
        this.update();
    }

    connectedCallback() {
        this.redraw();
    }

    static get observedAttributes() {
        return ['data-width', 'data-height', 'data-states'];
    }

    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.redraw();
    }

    playSolution(solution) {
        if (solution.length == 0) {
            this.solve_button.textContent = 'Lösen';
            this.gameState = State.PLAYING;
            return;
        }
        const move = solution.shift();
        this.press(move.i, move.j);
        ++this.move_count;
        this.update();
        setTimeout(() => this.playSolution(solution), 500);
    }

    solve() {
        if (this.gameState != State.PLAYING)
            return;
        const puzzle = [];
        for (let j = 0; j < this.M; ++j) {
            let row = [];
            for (let i = 0; i < this.N; ++i) {
                row.push(parseInt(this.buttons[i + j * this.N].getAttribute('data-state')));
            }
            puzzle.push(row);
        }
        const solver = new LightsoutSolver(puzzle, this.nStates);
        const solutions = solver.solve();
        if (solutions.length === 0) {
            alert('Hoppsa, keine Lösung gefunden!');
            return;
        }
        const solution = solutions.shift();
        const solution_clicks = [];
        for (let j = 0; j < this.M; ++j) {
            for (let i = 0; i < this.N; ++i) {
                const num_presses = solution[j][i];
                for (let k = 0; k < num_presses; ++k) {
                    solution_clicks.push({ i, j });
                }
            }
        }
        this.solve_button.textContent = 'Abbrechen';
        this.gameState = State.SOLVING;
        this.move_count = 0;
        this.playSolution(solution_clicks);
    }

    hasWon() {
        const state = this.buttons[0].getAttribute('data-state');
        return this.buttons.every(button => button.getAttribute('data-state') === state);
    }

    turn(i, j) {
        if (i < 0 || i >= this.N || j < 0 || j >= this.M)
            return;
        const button = this.buttons[i + j * this.N];
        let state = parseInt(button.getAttribute('data-state'));
        button.classList.remove(`state-${state}`);
        state = (state + 1) % this.nStates;
        button.classList.add(`state-${state}`);
        button.setAttribute('data-state', state);
    }

    press(i, j) {
        this.turn(i, j);
        this.turn(i - 1, j);
        this.turn(i + 1, j);
        this.turn(i, j - 1);
        this.turn(i, j + 1);
    }

    update() {
        this.moves_el.textContent = `${this.move_count}`;
    }

    onClick(i, j) {
        if (this.gameState != State.PLAYING)
            return;
        this.press(i, j);
        if (this.hasWon()) {
            setTimeout(() => alert('Du hast gewonnen!'), 1);
        }
        ++this.move_count;
        this.update();
    }

    shuffle() {
        do {
            for (let i = 0; i <= Math.floor(this.N * 2); ++i) {
                this.press(Math.floor(Math.random() * this.N), Math.floor(Math.random() * this.N));
            }
        } while (this.hasWon());
    }
};

function init() {
    customElements.define('lightsout-game', Lightsout, { extends: 'div' });
}

window.addEventListener('load', init);
