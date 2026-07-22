/**
 * Bottle Fetch — a pixel-art scene widget.
 *
 * A Bedlington terrier hangs out on a strip of park in front of a road. The
 * user can click the 2-liter plastic bottle to throw it; the dog runs after
 * it and carries it around. Clicking the dog (or the bottle in its mouth)
 * makes it drop it.
 *
 * All colors are resolved at runtime from the site's CSS custom properties,
 * and the scene mood follows the theme switcher:
 *   yellow → day, blue → night (moon, stars, one car with headlights),
 *   pink → early morning (deep pink sky, rising sun, sparse traffic).
 * Everything is drawn on a coarse logical pixel grid for the pixel-art look.
 */

/* ---------------------------------------------------------------- scene */

const SCENE_H = 64; // logical pixels
const ROAD_TOP = 40;
const ROAD_BOTTOM = 52;
const CURB_BOTTOM = 54;
const BASE = 61; // ground line the dog and bottle stand on

const GRAVITY = 150; // logical px / s²
const RUN_SPEED = 58;
const WALK_SPEED = 13;

type Mode = "day" | "night" | "dawn";
type DogState = "idle" | "wander" | "chase" | "grab" | "carry" | "drop";
type BottleState = "rest" | "fly" | "carried";

interface Cloud {
	x: number;
	y: number;
	speed: number;
	kind: number;
}

interface Star {
	x: number;
	y: number;
	phase: number;
}

interface Car {
	x: number;
	lane: number; // 0 = far (leftward), 1 = near (rightward)
	color: string;
	speed: number;
}

interface Building {
	w: number;
	h: number;
	shade: number;
	windows: boolean[];
}

/* ---------------------------------------------------------------- bottle */

// Upright 2L bottle, 7×16. o outline, p cap, c clear plastic, w shine,
// d shaded plastic, l label, L label print.
const BOTTLE_UP = [
	"..ppp..",
	"..ppp..",
	"..oco..",
	".ocwdo.",
	"ocwccdo",
	"ocwccdo",
	"olllllo",
	"olLlLlo",
	"olllllo",
	"ocwccdo",
	"ocwccdo",
	"odccddo",
	"ocwccdo",
	"odccddo",
	"ocwccdo",
	".ooooo.",
];

function rotateCW(grid: string[]): string[] {
	const h = grid.length;
	const w = grid[0].length;
	const out: string[] = [];
	for (let x = 0; x < w; x++) {
		let row = "";
		for (let y = h - 1; y >= 0; y--) row += grid[y][x];
		out.push(row);
	}
	return out;
}

// 0: upright, 1: cap right, 2: upside down, 3: cap left
const BOTTLE_FRAMES: string[][] = [BOTTLE_UP];
for (let i = 1; i < 4; i++) {
	BOTTLE_FRAMES.push(rotateCW(BOTTLE_FRAMES[i - 1]));
}

/* ---------------------------------------------------------------- palette */

const TOKEN_MAP: Record<string, string> = {
	sky: "--block-card-background",
	ground: "--surface-accent",
	road: "--clr-gray-700",
	roadLine: "--clr-gray-100",
	curb: "--clr-gray-500",
	ink: "--clr-black",
	white: "--clr-white",
	coat: "--clr-gray-100",
	coatDark: "--clr-gray-700",
	collar: "--badge-background",
	sun: "--clr-yellow-500",
	sunCore: "--clr-yellow-700",
	night: "--clr-black",
	moon: "--clr-white",
	moonShade: "--clr-gray-500",
	pink100: "--clr-pink-100",
	pink300: "--clr-pink-300",
	pink500: "--clr-pink-500",
	plastic: "--clr-blueberry-100",
	plasticShade: "--clr-blueberry-200",
	cap: "--clr-blueberry-500",
	label: "--badge-background",
	labelInk: "--badge-text",
	carPink: "--clr-pink-500",
	carBlue: "--clr-blueberry-500",
	carYellow: "--clr-yellow-500",
	carLavender: "--clr-lavender-300",
	buildingA: "--clr-gray-500",
	buildingB: "--clr-gray-700",
};

type Palette = Record<keyof typeof TOKEN_MAP, string>;

function readPalette(): Palette {
	const styles = getComputedStyle(document.documentElement);
	const pal = {} as Palette;
	for (const key of Object.keys(TOKEN_MAP)) {
		pal[key] = styles.getPropertyValue(TOKEN_MAP[key]).trim() || "#888";
	}
	return pal;
}

/* ---------------------------------------------------------------- helpers */

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/* ---------------------------------------------------------------- game */

class BottleFetch {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private pal: Palette;
	private mode: Mode = "day";
	private reducedMotion: boolean;

	private px = 3; // CSS pixels per logical pixel
	private width = 200; // logical scene width
	private running = false;
	private visible = true;
	private rafId = 0;
	private lastTime = 0;
	private clock = 0;

	// dog
	private dog = {
		x: 60,
		dir: 1,
		state: "idle" as DogState,
		stateTime: 0,
		target: 60,
		idleUntil: 2,
		tailTime: 0,
		blinkTime: 0,
		panting: 0,
	};

	// bottle
	private bottle = {
		x: 120,
		alt: 0, // altitude of the sprite's bottom above ground
		vx: 0,
		vy: 0,
		state: "rest" as BottleState,
		frame: 0, // index into BOTTLE_FRAMES while resting
		spinTime: 0,
	};

	private clouds: Cloud[] = [];
	private stars: Star[] = [];
	private cars: Car[] = [];
	private carTimers = [rand(0.5, 2), rand(1, 3)];
	private buildings: Building[] = [];

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("no 2d context");
		this.ctx = ctx;
		this.reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		this.pal = readPalette();
		this.refreshTheme();

		this.initScenery();
		this.bindEvents();
		this.resize();
		// debug/testing handle
		(canvas as HTMLCanvasElement & { __bf?: BottleFetch }).__bf = this;
	}

	/** Advance the simulation by `seconds` and redraw (used for testing). */
	step(seconds: number) {
		for (let t = 0; t < seconds; t += 1 / 60) {
			this.clock += 1 / 60;
			this.update(1 / 60);
		}
		this.draw();
	}

	/* ------------------------------------------------ setup & lifecycle */

	private refreshTheme() {
		this.pal = readPalette();
		const theme = document.documentElement.getAttribute("data-theme");
		this.mode =
			theme === "blue" ? "night" : theme === "pink" ? "dawn" : "day";
		// Quiet hours: thin out any daytime rush-hour leftovers.
		if (this.mode !== "day") this.cars = this.cars.slice(0, 1);
	}

	private initScenery() {
		for (let i = 0; i < 4; i++) {
			this.clouds.push({
				x: rand(0, 400),
				y: rand(9, 16),
				speed: rand(1.5, 3.5),
				kind: randInt(0, 2),
			});
		}
	}

	private buildSkyline() {
		this.buildings = [];
		let covered = 0;
		let i = 0;
		while (covered < this.width + 24) {
			const w = randInt(10, 18);
			this.buildings.push({
				w,
				h: randInt(9, 22),
				shade: i % 2,
				windows: Array.from({ length: 24 }, () => Math.random() < 0.5),
			});
			covered += w + 3;
			i++;
		}
		this.stars = Array.from(
			{ length: Math.max(8, Math.floor(this.width / 12)) },
			() => ({
				x: rand(1, this.width - 1),
				y: rand(2, 22),
				phase: rand(0, Math.PI * 2),
			}),
		);
	}

	private bindEvents() {
		const observer = new MutationObserver(() => {
			this.refreshTheme();
			if (!this.running) this.draw();
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme"],
		});

		new ResizeObserver(() => this.resize()).observe(this.canvas);

		// Pause off-screen; hidden tabs are handled by the browser's own
		// requestAnimationFrame throttling.
		new IntersectionObserver((entries) => {
			this.visible = entries[0].isIntersecting;
			this.updateRunning();
		}).observe(this.canvas);

		this.canvas.addEventListener("pointerdown", (e) => {
			const rect = this.canvas.getBoundingClientRect();
			const x = (e.clientX - rect.left) / this.px;
			const y = (e.clientY - rect.top) / this.px;
			this.handleTap(x, y);
		});

		this.canvas.addEventListener("pointermove", (e) => {
			const rect = this.canvas.getBoundingClientRect();
			const x = (e.clientX - rect.left) / this.px;
			const y = (e.clientY - rect.top) / this.px;
			const hot =
				(this.bottle.state === "rest" && this.hitBottle(x, y)) ||
				(this.dog.state === "carry" && this.hitDog(x, y));
			this.canvas.style.cursor = hot ? "pointer" : "default";
		});

		this.canvas.addEventListener("keydown", (e) => {
			if (e.key !== "Enter" && e.key !== " ") return;
			e.preventDefault();
			if (this.dog.state === "carry") this.startDrop();
			else if (this.bottle.state === "rest") this.throwBottle();
		});
	}

	private updateRunning() {
		const shouldRun = this.visible;
		if (shouldRun && !this.running) {
			this.running = true;
			this.lastTime = performance.now();
			this.rafId = requestAnimationFrame(this.tick);
		} else if (!shouldRun && this.running) {
			this.running = false;
			cancelAnimationFrame(this.rafId);
		}
	}

	private resize() {
		const cssWidth = this.canvas.clientWidth || 300;
		this.px = cssWidth < 480 ? 2.5 : 3;
		this.width = Math.max(90, Math.round(cssWidth / this.px));
		const dpr = window.devicePixelRatio || 1;
		this.canvas.width = Math.round(cssWidth * dpr);
		this.canvas.height = Math.round(SCENE_H * this.px * dpr);
		this.canvas.style.height = `${SCENE_H * this.px}px`;
		this.ctx.setTransform(this.px * dpr, 0, 0, this.px * dpr, 0, 0);
		this.buildSkyline();
		this.dog.x = Math.min(this.dog.x, this.width - 14);
		this.bottle.x = Math.min(this.bottle.x, this.width - 10);
		this.draw();
	}

	/* ------------------------------------------------ interaction */

	private hitBottle(x: number, y: number): boolean {
		const grid = BOTTLE_FRAMES[this.bottle.frame];
		const w = grid[0].length;
		const h = grid.length;
		const cx = this.bottle.x;
		const cy = BASE - this.bottle.alt - h / 2;
		return Math.abs(x - cx) < w / 2 + 4 && Math.abs(y - cy) < h / 2 + 4;
	}

	private hitDog(x: number, y: number): boolean {
		return Math.abs(x - this.dog.x) < 24 && y > BASE - 32 && y < BASE + 3;
	}

	private handleTap(x: number, y: number) {
		if (
			this.dog.state === "carry" &&
			(this.hitDog(x, y) || this.hitBottle(x, y))
		) {
			this.startDrop();
			return;
		}
		if (this.bottle.state === "rest" && this.hitBottle(x, y)) {
			this.throwBottle();
		}
	}

	private throwBottle() {
		const b = this.bottle;
		// Throw toward whichever side has more room.
		const dir = b.x < this.width / 2 ? 1 : -1;
		b.state = "fly";
		b.vy = rand(60, 85);
		b.vx = dir * rand(28, 55);
		b.alt = Math.max(b.alt, 8);
		b.spinTime = 0;
		this.dog.state = "chase";
		this.dog.stateTime = 0;
		this.dog.panting = 0;
	}

	private startDrop() {
		this.dog.state = "drop";
		this.dog.stateTime = 0;
	}

	/* ------------------------------------------------ update */

	private tick = (now: number) => {
		if (!this.running) return;
		const dt = Math.min(0.05, (now - this.lastTime) / 1000);
		this.lastTime = now;
		this.clock += dt;
		this.update(dt);
		this.draw();
		this.rafId = requestAnimationFrame(this.tick);
	};

	private update(dt: number) {
		this.updateBottle(dt);
		this.updateDog(dt);
		if (!this.reducedMotion) {
			this.updateClouds(dt);
			this.updateCars(dt);
		}
	}

	private updateBottle(dt: number) {
		const b = this.bottle;
		if (b.state !== "fly") return;

		b.vy -= GRAVITY * dt;
		b.alt += b.vy * dt;
		b.x += b.vx * dt;
		b.spinTime += dt;

		// tumble in 90° steps to stay on the pixel grid
		if (b.spinTime > 0.09) {
			b.frame = (b.frame + 1) % 4;
			b.spinTime = 0;
		}

		// side walls
		if (b.x < 6) {
			b.x = 6;
			b.vx = Math.abs(b.vx) * 0.7;
		} else if (b.x > this.width - 6) {
			b.x = this.width - 6;
			b.vx = -Math.abs(b.vx) * 0.7;
		}

		// ground bounce — plastic bottles bounce a little chaotically
		if (b.alt <= 0 && b.vy < 0) {
			b.alt = 0;
			if (Math.abs(b.vy) > 28) {
				b.vy = Math.abs(b.vy) * rand(0.35, 0.5);
				b.vx = b.vx * 0.7 + rand(-6, 6);
			} else {
				b.state = "rest";
				// Ends up lying on its side, cap away from the throw.
				b.frame = b.vx >= 0 ? 1 : 3;
				b.vy = 0;
				b.vx = 0;
			}
		}
	}

	private updateDog(dt: number) {
		const d = this.dog;
		const b = this.bottle;
		d.stateTime += dt;
		d.tailTime += dt;
		d.blinkTime += dt;
		if (d.blinkTime > rand(3, 5)) d.blinkTime = -0.12;
		if (d.panting > 0) d.panting -= dt;

		switch (d.state) {
			case "idle": {
				if (this.reducedMotion) break;
				if (this.clock > d.idleUntil) {
					d.state = "wander";
					d.target = rand(16, this.width - 16);
					d.dir = d.target > d.x ? 1 : -1;
				}
				break;
			}
			case "wander": {
				this.moveToward(d.target, WALK_SPEED, dt);
				if (Math.abs(d.x - d.target) < 2) {
					d.state = "idle";
					d.idleUntil = this.clock + rand(3, 8);
				}
				break;
			}
			case "chase": {
				this.moveToward(b.x, RUN_SPEED, dt);
				const mouthX = d.x + d.dir * 21;
				if (
					b.state === "rest" &&
					(Math.abs(mouthX - b.x) < 5 || Math.abs(d.x - b.x) < 5)
				) {
					d.state = "grab";
					d.stateTime = 0;
				}
				break;
			}
			case "grab": {
				if (d.stateTime > 0.3) {
					b.state = "carried";
					d.state = "carry";
					d.stateTime = 0;
					d.panting = 3;
					d.target = rand(20, this.width - 20);
				}
				break;
			}
			case "carry": {
				// Trot around proudly with the bottle.
				if (!this.reducedMotion) {
					if (Math.abs(d.x - d.target) < 3) {
						if (d.stateTime > rand(2, 5)) {
							d.target = rand(20, this.width - 20);
							d.stateTime = 0;
						}
					} else {
						this.moveToward(d.target, WALK_SPEED * 1.4, dt);
					}
				}
				b.x = d.x + d.dir * 23;
				b.alt = 17;
				break;
			}
			case "drop": {
				if (d.stateTime > 0.35) {
					b.state = "rest";
					b.x = d.x + d.dir * 12;
					b.alt = 0;
					b.frame = d.dir > 0 ? 1 : 3;
					d.state = "wander";
					d.target = d.x - d.dir * rand(14, 24);
					d.dir = -d.dir;
				}
				break;
			}
		}
	}

	private moveToward(target: number, speed: number, dt: number) {
		const d = this.dog;
		const delta = target - d.x;
		d.dir = delta >= 0 ? 1 : -1;
		const step = Math.min(Math.abs(delta), speed * dt);
		d.x += d.dir * step;
		d.x = Math.max(16, Math.min(this.width - 16, d.x));
	}

	private updateClouds(dt: number) {
		for (const c of this.clouds) {
			c.x -= c.speed * dt;
			if (c.x < -30) {
				c.x = this.width + rand(5, 40);
				c.y = rand(9, 16);
			}
		}
	}

	private updateCars(dt: number) {
		// Night: a lone car now and then. Dawn: sparse early traffic.
		const maxCars = this.mode === "day" ? 4 : 1;
		for (let lane = 0; lane < 2; lane++) {
			this.carTimers[lane] -= dt;
			if (this.carTimers[lane] <= 0) {
				this.carTimers[lane] =
					this.mode === "day"
						? rand(4, 11)
						: this.mode === "dawn"
							? rand(8, 16)
							: rand(12, 24);
				const laneOk = this.mode !== "night" || lane === 1;
				if (this.cars.length < maxCars && laneOk) {
					const colors = [
						this.pal.carPink,
						this.pal.carBlue,
						this.pal.carYellow,
						this.pal.carLavender,
						this.pal.white,
					];
					this.cars.push({
						lane,
						x: lane === 0 ? this.width + 24 : -24,
						color: pick(colors),
						speed: lane === 0 ? -rand(26, 34) : rand(36, 48),
					});
				}
			}
		}
		for (const car of this.cars) car.x += car.speed * dt;
		this.cars = this.cars.filter((c) => c.x > -40 && c.x < this.width + 40);
	}

	/* ------------------------------------------------ drawing */

	private r(x: number, y: number, w: number, h: number, color: string) {
		this.ctx.fillStyle = color;
		this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
	}

	private draw() {
		const { pal, mode } = this;
		const W = this.width;
		this.ctx.clearRect(0, 0, W + 2, SCENE_H);

		// sky
		if (mode === "night") {
			this.r(0, 0, W + 1, ROAD_TOP, pal.night);
			this.drawStars();
			this.drawMoon(W - 36, 4);
		} else if (mode === "dawn") {
			this.r(0, 0, W + 1, 12, pal.pink500);
			this.r(0, 12, W + 1, 12, pal.pink300);
			this.r(0, 24, W + 1, ROAD_TOP - 24, pal.pink100);
			this.drawRisingSun(Math.floor(W * 0.3));
			for (const c of this.clouds) this.drawCloud(c);
		} else {
			this.r(0, 0, W + 1, ROAD_TOP, pal.sky);
			this.drawSun(W - 34, 6);
			for (const c of this.clouds) this.drawCloud(c);
		}
		this.drawSkyline();

		// road
		this.r(0, ROAD_TOP, W + 1, ROAD_BOTTOM - ROAD_TOP, pal.road);
		for (let x = 0; x < W; x += 10) {
			this.r(x, 46, 5, 1, pal.roadLine);
		}
		if (mode === "night") {
			this.ctx.globalAlpha = 0.35;
			this.r(0, ROAD_TOP, W + 1, ROAD_BOTTOM - ROAD_TOP, pal.night);
			this.ctx.globalAlpha = 1;
		}
		const farCars = this.cars.filter((c) => c.lane === 0);
		const nearCars = this.cars.filter((c) => c.lane === 1);
		for (const car of farCars) this.drawCar(car, 45);
		for (const car of nearCars) this.drawCar(car, 51);

		// curb + ground
		this.r(0, ROAD_BOTTOM, W + 1, CURB_BOTTOM - ROAD_BOTTOM, pal.curb);
		this.r(0, CURB_BOTTOM, W + 1, SCENE_H - CURB_BOTTOM, pal.ground);
		if (mode === "night") {
			this.ctx.globalAlpha = 0.3;
			this.r(0, ROAD_BOTTOM, W + 1, SCENE_H - ROAD_BOTTOM, pal.night);
			this.ctx.globalAlpha = 1;
		}
		// ground speckles
		this.ctx.globalAlpha = 0.18;
		for (let x = 2; x < W; x += 7) {
			const y = CURB_BOTTOM + 2 + ((x * 13) % 8);
			this.r(x, y, 2, 1, pal.ink);
		}
		this.ctx.globalAlpha = 1;

		// actors
		if (this.bottle.state !== "carried") this.drawBottle();
		this.drawDog();
		if (this.bottle.state === "carried") this.drawBottle();
	}

	private drawSun(x: number, y: number) {
		const { pal } = this;
		this.r(x + 1, y, 5, 7, pal.sun);
		this.r(x, y + 1, 7, 5, pal.sun);
		this.r(x + 2, y + 2, 3, 3, pal.sunCore);
	}

	private drawRisingSun(cx: number) {
		const { pal } = this;
		// soft glow first
		this.ctx.globalAlpha = 0.3;
		this.r(cx - 8, ROAD_TOP - 8, 17, 8, pal.sun);
		this.ctx.globalAlpha = 1;
		// half-disc peeking over the horizon (skyline occludes the base)
		this.r(cx - 2, ROAD_TOP - 6, 5, 1, pal.sun);
		this.r(cx - 3, ROAD_TOP - 5, 7, 1, pal.sun);
		this.r(cx - 4, ROAD_TOP - 4, 9, 2, pal.sun);
		this.r(cx - 5, ROAD_TOP - 2, 11, 2, pal.sun);
		this.r(cx - 2, ROAD_TOP - 3, 5, 2, pal.sunCore);
	}

	private drawMoon(x: number, y: number) {
		const { pal } = this;
		const rows: Array<[number, number]> = [
			[2, 3],
			[1, 5],
			[0, 7],
			[0, 7],
			[0, 7],
			[1, 5],
			[2, 3],
		];
		rows.forEach(([ox, w], i) => this.r(x + ox, y + i, w, 1, pal.moon));
		this.r(x + 2, y + 2, 1, 1, pal.moonShade);
		this.r(x + 4, y + 4, 1, 1, pal.moonShade);
		this.r(x + 3, y + 1, 1, 1, pal.moonShade);
	}

	private drawStars() {
		const { pal } = this;
		for (const s of this.stars) {
			const tw = 0.5 + 0.4 * Math.sin(this.clock * 1.4 + s.phase);
			this.ctx.globalAlpha = Math.max(0.1, tw);
			this.r(s.x, s.y, 1, 1, pal.white);
		}
		this.ctx.globalAlpha = 1;
	}

	private drawCloud(c: Cloud) {
		const { pal } = this;
		this.ctx.globalAlpha = 0.9;
		this.r(c.x, c.y + 2, 16 + c.kind * 3, 3, pal.white);
		this.r(c.x + 3, c.y, 7 + c.kind * 2, 2, pal.white);
		this.r(c.x + 5, c.y + 5, 8, 1, pal.white);
		this.ctx.globalAlpha = 1;
	}

	private drawSkyline() {
		const { pal, mode } = this;
		let x = -4;
		this.ctx.globalAlpha = mode === "night" ? 0.8 : 0.55;
		for (const b of this.buildings) {
			const top = ROAD_TOP - b.h;
			this.r(x, top, b.w, b.h, b.shade ? pal.buildingA : pal.buildingB);
			x += b.w + 3;
		}
		this.ctx.globalAlpha = 1;
		// windows: lit at night, a few early risers at dawn
		x = -4;
		for (const b of this.buildings) {
			const top = ROAD_TOP - b.h;
			let wi = 0;
			for (let wy = top + 2; wy < ROAD_TOP - 2; wy += 4) {
				for (let wx = x + 2; wx < x + b.w - 2; wx += 4) {
					const on = b.windows[wi++ % b.windows.length];
					if (!on) continue;
					if (mode === "night") {
						this.ctx.globalAlpha = 0.9;
						this.r(wx, wy, 2, 2, pal.sun);
					} else if (mode === "dawn") {
						this.ctx.globalAlpha = 0.7;
						this.r(
							wx,
							wy,
							2,
							2,
							wi % 3 === 0 ? pal.sun : pal.roadLine,
						);
					} else {
						this.ctx.globalAlpha = 0.55;
						this.r(wx, wy, 2, 2, pal.roadLine);
					}
				}
			}
			this.ctx.globalAlpha = 1;
			x += b.w + 3;
		}
	}

	private drawCar(car: Car, baseline: number) {
		const { pal, mode } = this;
		const x = Math.round(car.x);
		const y = baseline;
		const flip = car.speed < 0;
		// outline silhouette
		this.r(x - 1, y - 8, 22, 6, pal.ink);
		this.r(x + (flip ? 8 : 3), y - 11, 10, 4, pal.ink);
		// cabin + body
		this.r(x + (flip ? 9 : 4), y - 10, 8, 3, car.color);
		this.r(x, y - 7, 20, 4, car.color);
		// windows
		this.r(x + (flip ? 10 : 5), y - 10, 3, 2, pal.roadLine);
		this.r(x + (flip ? 14 : 9), y - 10, 3, 2, pal.roadLine);
		// wheels
		this.r(x + 3, y - 3, 3, 3, pal.ink);
		this.r(x + 14, y - 3, 3, 3, pal.ink);
		this.r(x + 4, y - 2, 1, 1, pal.curb);
		this.r(x + 15, y - 2, 1, 1, pal.curb);

		if (mode === "night") {
			// dim the paintwork, then punch through with lights
			this.ctx.globalAlpha = 0.3;
			this.r(x - 1, y - 11, 22, 11, pal.night);
			this.ctx.globalAlpha = 1;
			if (flip) {
				this.r(x - 1, y - 6, 2, 2, pal.sun);
				this.r(x + 20, y - 6, 1, 2, pal.carPink);
				this.ctx.globalAlpha = 0.3;
				this.r(x - 6, y - 7, 5, 4, pal.sun);
				this.ctx.globalAlpha = 0.16;
				this.r(x - 12, y - 8, 6, 6, pal.sun);
				this.ctx.globalAlpha = 0.08;
				this.r(x - 19, y - 9, 7, 8, pal.sun);
			} else {
				this.r(x + 19, y - 6, 2, 2, pal.sun);
				this.r(x - 1, y - 6, 1, 2, pal.carPink);
				this.ctx.globalAlpha = 0.3;
				this.r(x + 21, y - 7, 5, 4, pal.sun);
				this.ctx.globalAlpha = 0.16;
				this.r(x + 26, y - 8, 6, 6, pal.sun);
				this.ctx.globalAlpha = 0.08;
				this.r(x + 32, y - 9, 7, 8, pal.sun);
			}
			this.ctx.globalAlpha = 1;
		}
	}

	private drawBottle() {
		const { pal } = this;
		const b = this.bottle;
		const grid =
			b.state === "carried"
				? BOTTLE_FRAMES[this.dog.dir > 0 ? 1 : 3]
				: BOTTLE_FRAMES[b.frame];
		const w = grid[0].length;
		const h = grid.length;
		const left = Math.round(b.x - w / 2);
		const top = Math.round(BASE - b.alt - h);

		const colors: Record<string, string> = {
			o: pal.ink,
			p: pal.cap,
			c: pal.plastic,
			w: pal.white,
			d: pal.plasticShade,
			l: pal.label,
			L: pal.labelInk,
		};
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const ch = grid[y][x];
				if (ch === ".") continue;
				this.r(left + x, top + y, 1, 1, colors[ch]);
			}
		}
	}

	/**
	 * A stylized Bedlington terrier: long slim legs, an arched back and tucked
	 * waist, a tapered pear-shaped head with a fluffy crown, and floppy ears.
	 * The thin low-hanging tail sways while idle.
	 */
	private drawDog() {
		const { pal } = this;
		const d = this.dog;
		const moving =
			d.state === "chase" ||
			d.state === "wander" ||
			(d.state === "carry" && Math.abs(d.x - d.target) >= 3);
		const running = d.state === "chase";
		const frame = moving
			? Math.floor(this.clock * (running ? 12 : 8)) % 4
			: 0;
		const bob = moving && frame % 2 === 1 ? 1 : 0;
		const headDy = d.state === "grab" || d.state === "drop" ? 4 : 0;

		const x = d.x;
		const dir = d.dir;
		const B = BASE;
		// local-space rect: dx measured from dog center toward facing side
		const R = (dx: number, y: number, w: number, h: number, c: string) => {
			const wx = dir > 0 ? x + dx : x - dx - w;
			this.r(wx, y, w, h, c);
		};

		// Tail — thin, low-set and tapering behind the rump.
		const sway = moving ? 0 : Math.floor(d.tailTime * 4) % 2;
		R(-12, B - 17 + bob, 2, 3, pal.ink);
		R(-14, B - 15 + bob, 3, 2, pal.ink);
		R(-15 + sway, B - 13 + bob, 2, 3, pal.ink);
		R(-11, B - 16 + bob, 1, 1, pal.coat);
		R(-13, B - 14 + bob, 2, 1, pal.coat);
		R(-14 + sway, B - 12 + bob, 1, 1, pal.coat);

		// Legs — deliberately long and fine, with alternating stride offsets.
		const cycles = running
			? [
					[3, -2, 3, -2],
					[1, 0, 1, 0],
					[-2, 3, -2, 3],
					[0, 1, 0, 1],
				]
			: [
					[1, 0, 0, 1],
					[0, 0, 0, 0],
					[0, 1, 1, 0],
					[0, 0, 0, 0],
				];
		const legDx = moving ? cycles[frame] : [0, 0, 0, 0];
		const legXs = [-8, -5, 4, 7];
		for (let i = 0; i < 4; i++) {
			const lx = legXs[i] + legDx[i];
			const lift = moving && legDx[i] > 1 ? 1 : 0;
			R(lx - 1, B - 10 + bob - lift, 3, 9 - bob, pal.ink);
			R(lx, B - 9 + bob - lift, 1, 7 - bob, pal.coat);
			R(lx - 1, B - 2 - lift, 3, 2, pal.ink);
			R(lx, B - 2 - lift, 2, 1, pal.coat);
		}

		// Arched body: high over the loin, deep at the chest, tucked at the waist.
		R(-11, B - 18 + bob, 20, 9, pal.ink);
		R(-8, B - 20 + bob, 13, 2, pal.ink);
		R(-10, B - 17 + bob, 18, 5, pal.coat);
		R(-7, B - 19 + bob, 11, 2, pal.coat);
		R(2, B - 12 + bob, 5, 2, pal.coat);
		R(-7, B - 19 + bob, 12, 2, pal.coatDark);
		R(-10, B - 17 + bob, 16, 2, pal.coatDark);
		R(-8, B - 12 + bob, 10, 1, pal.white);

		// Long neck lifts the narrow head clear of the shoulders.
		R(4, B - 23 + bob + headDy, 7, 13, pal.ink);
		R(5, B - 22 + bob + headDy, 5, 11, pal.coat);
		R(5, B - 18 + bob + headDy, 2, 4, pal.collar);

		// Floppy ears sit behind the head and taper as they hang.
		R(8, B - 28 + bob + headDy, 4, 6, pal.ink);
		R(9, B - 27 + bob + headDy, 2, 4, pal.coatDark);
		R(5, B - 27 + bob + headDy, 5, 5, pal.ink);
		R(4, B - 24 + bob + headDy, 5, 5, pal.ink);
		R(5, B - 20 + bob + headDy, 3, 2, pal.ink);
		R(6, B - 26 + bob + headDy, 3, 3, pal.coatDark);
		R(5, B - 23 + bob + headDy, 3, 3, pal.coatDark);
		R(6, B - 20 + bob + headDy, 1, 1, pal.coatDark);

		// Pear-shaped, aerodynamic head: domed crown flowing into a long muzzle.
		R(7, B - 30 + bob + headDy, 7, 2, pal.ink);
		R(6, B - 29 + bob + headDy, 10, 6, pal.ink);
		R(10, B - 25 + bob + headDy, 9, 5, pal.ink);
		R(17, B - 24 + bob + headDy, 5, 4, pal.ink);
		R(8, B - 29 + bob + headDy, 6, 2, pal.white);
		R(7, B - 27 + bob + headDy, 8, 3, pal.coat);
		R(11, B - 24 + bob + headDy, 7, 3, pal.coat);
		R(17, B - 23 + bob + headDy, 4, 2, pal.white);
		R(20, B - 23 + bob + headDy, 2, 2, pal.ink);
		// The nearer ear overlaps the cheek so its droop remains legible in profile.
		R(6, B - 27 + bob + headDy, 5, 3, pal.ink);
		R(5, B - 25 + bob + headDy, 5, 5, pal.ink);
		R(6, B - 21 + bob + headDy, 3, 3, pal.ink);
		R(7, B - 19 + bob + headDy, 1, 1, pal.ink);
		R(7, B - 26 + bob + headDy, 3, 2, pal.coatDark);
		R(6, B - 24 + bob + headDy, 3, 4, pal.coatDark);
		R(7, B - 20 + bob + headDy, 1, 2, pal.coatDark);
		// eye (blinks)
		if (d.blinkTime >= 0) R(13, B - 25 + bob + headDy, 1, 1, pal.ink);
		// tongue when panting
		if (d.panting > 0 && headDy === 0) {
			R(19, B - 20 + bob, 1, 2, pal.carPink);
		}
	}
}

/* ---------------------------------------------------------------- mount */

export function mountBottleFetch() {
	const canvases = document.querySelectorAll<HTMLCanvasElement>(
		"canvas[data-bottle-fetch]",
	);
	canvases.forEach((canvas) => {
		if (canvas.dataset.mounted) return;
		canvas.dataset.mounted = "true";
		new BottleFetch(canvas);
	});

	// Small theme dots on the widget — same behavior as the ThemeSwitcher.
	document
		.querySelectorAll<HTMLButtonElement>("button[data-set-theme]")
		.forEach((btn) => {
			if (btn.dataset.bound) return;
			btn.dataset.bound = "true";
			btn.addEventListener("click", () => {
				const theme = btn.dataset.setTheme;
				if (!theme) return;
				document.documentElement.setAttribute("data-theme", theme);
				localStorage.setItem("theme", theme);
			});
		});
}
