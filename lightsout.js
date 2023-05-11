(function (window) {
    "use strict";

    /// Original solver by Norio Kato, http://www.ueda.info.waseda.ac.jp/~n-kato/lightsout/ 
    /// Modified 2023 by Oliver Lau <ola@ct.de>
    class LightsoutSolver {
        constructor(puzzle, nStates) {
            this.cells = puzzle;
            this.N = this.cells.length;
            this.M = this.cells[0].length;
            this.nStates = nStates;
        }

        a(i, j) {
            return this.mat[i][this.cols[j]];
        }

        setmat(i, j, val) {
            this.mat[i][this.cols[j]] = this.modulate(val);
        }

        modulate(x) {
            if (x >= 0)
                return x % this.nStates;
            x = (-x) % this.nStates;
            if (x === 0)
                return 0;
            return this.nStates - x;
        }

        gcd(x, y) {
            if (y === 0)
                return x;
            if (x === y)
                return x;
            if (x > y)
                x = x % y;
            while (x > 0) {
                y = y % x;
                if (y === 0)
                    return x;
                x = x % y;
            }
            return y;
        }

        invert(value) {
            let a = 1, b = 0, c = 0, d = 1;
            let y = this.nStates;
            if (value <= 1)
                return value;
            let x = value;
            const seed = this.gcd(value, this.nStates);
            if (seed !== 1)
                return 0;
            while (x > 1) {
                const f = Math.floor(y / x);
                y -= x * f;
                c -= a * f;
                d -= b * f;
                [a, c] = [c, a];
                [b, d] = [d, b];
                [x, y] = [y, x];
            }
            return a;
        }

        initMatrix() {
            this.maxr = Math.min(this.m, this.n);
            this.mat = [];
            for (let x = 0; x < this.N; ++x) {
                for (let y = 0; y < this.M; ++y) {
                    let i = y * this.N + x;
                    let line = [];
                    this.mat[i] = line;
                    for (let j = 0; j < this.n; ++j) {
                        line[j] = 0;
                    }
                    line[i] = 1;
                    if (x > 0) {
                        line[i - 1] = 1;
                    }
                    if (y > 0) {
                        line[i - this.N] = 1;
                    }
                    if (x < this.N - 1) {
                        line[i + 1] = 1;
                    }
                    if (y < this.M - 1) {
                        line[i + this.N] = 1;
                    }
                }
            }
            this.cols = [];
            for (let j = 0; j < this.np; ++j) {
                this.cols[j] = j;
            }
        }

        solvedProblem(goal) {
            const size = this.N * this.M;
            this.m = size;
            this.n = size;
            this.np = this.n + 1;
            this.initMatrix();
            for (let x = 0; x < this.N; ++x) {
                for (let y = 0; y < this.M; ++y) {
                    this.mat[y * this.N + x][this.n] = this.modulate(goal - this.cells[x][y]);
                }
            }
            return this.sweep();
        }

        sweep() {
            for (this.r = 0; this.r < this.maxr; ++this.r) {
                if (!this.sweepStep()) {
                    return false;
                }
                if (this.r === this.maxr) {
                    break;
                }
            }
            return true;
        }

        sweepStep() {
            let finished = true;
            for (let j = this.r; j < this.n; ++j) {
                for (let i = this.r; i < this.m; ++i) {
                    const aij = this.a(i, j);
                    if (aij !== 0)
                        finished = false;
                    const inv = this.invert(aij);
                    if (inv !== 0) {
                        for (let jj = this.r; jj < this.np; ++jj) {
                            this.setmat(i, jj, this.a(i, jj) * inv);
                        }
                        this.doBasicSweep(i, j);
                        return true;
                    }
                }
            }
            if (finished) {
                this.maxr = this.r;
                for (let j = this.n; j < this.np; ++j)
                    for (let i = this.r; i < this.m; ++i)
                        if (this.a(i, j) !== 0)
                            return false;
                return true;
            }
            return false;
        }

        swap(array, x, y) {
            [array[x], array[y]] = [array[y], array[x]];
        }

        doBasicSweep(pivoti, pivotj) {
            if (this.r !== pivoti) {
                this.swap(this.mat, this.r, pivoti);
            }
            if (this.r !== pivotj) {
                this.swap(this.cols, r, pivotj);
            }
            for (let i = 0; i < this.m; ++i) {
                if (i !== this.r) {
                    const air = this.a(i, this.r);
                    if (air !== 0) {
                        for (let j = this.r; j < this.np; ++j) {
                            this.setmat(i, j, this.a(i, j) - this.a(this.r, j) * air);
                        }
                    }
                }
            }
        }

        solve() {
            let solutions = [];
            for (let goal = 0; goal < this.nStates; ++goal) {
                let solution = new Array(this.N);
                for (let i = 0; i < this.N; ++i) {
                    solution[i] = new Array(this.M);
                }
                if (this.solvedProblem(goal)) {
                    let anscols = [];
                    for (let j = 0; j < this.n; ++j) {
                        anscols[this.cols[j]] = j;
                    }
                    for (let x = 0; x < this.N; ++x) {
                        for (let y = 0; y < this.M; ++y) {
                            const j = anscols[y * this.N + x];
                            solution[x][y] = this.a(j, this.n);
                        }
                    }
                    solutions.push(solution);
                }
            }
            return solutions;
        }
    };


    /************************************************
     * 
     * Lightsout
     * 
     ************************************************/
    const State = {
        PLAYING: 0,
        SOLVING: 1,
    };

    class Lightsout {
        constructor(n, m, nStates) {
            this.gameState = State.PLAYING;
            this.N = n;
            this.M = m;
            this.nStates = nStates;
            this.buttons = [];
            this.move_count = 0;
            this.moves_el = document.getElementById('moves');
            const div = document.createElement('div');
            div.id = 'game';
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
            div.style.gridTemplateColumns = `repeat(${this.N}, 50px)`;
            document.body.insertBefore(div, document.getElementById('score'));
            this.shuffle();
            this.solve_button = document.querySelector('button#solve');
            this.solve_button.addEventListener('click', () => this.solve());
            this.update();
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
        const game = new Lightsout(5, 5, 4);
    }

    window.addEventListener('load', init);
})(window);