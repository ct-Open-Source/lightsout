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
