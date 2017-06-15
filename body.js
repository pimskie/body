/* globals Vector: false */

class Body {
	constructor({ position = new Vector(), acceleration = new Vector(), mass = 1, velocity = new Vector(), color = '#000' } = {}) {
		this.position = position;
		this.acceleration = acceleration;
		this.velocity = velocity;
		this.mass = mass;
		this.radius = this.mass;
		this.color = color;
	}

	checkCollision(width, height, friction = 1, bodies = []) {
		if (width) {
			if (this.position.x < 0) {
				this.position.x = 0;
				this.velocity.x *= -1;
				this.velocity.multiplySelf(friction);
			} else if (this.position.x > width) {
				this.position.x = width;
				this.velocity.x *= -1;
				this.velocity.multiplySelf(friction);
			}
		}

		if (height) {
			if (this.position.y < 0) {
				this.position.y = 0;
				this.velocity.y *= -1;
				this.velocity.multiplySelf(friction);
			} else if (this.position.y > height) {
				this.position.y = height;
				this.velocity.y *= -1;
				this.velocity.multiplySelf(friction);
			}
		}

		bodies
			.filter(body => body !== this)
			.forEach((body) => {
				const radii = this.radius + body.radius;
				const dist = this.position.subtract(body.position).length;

				if (dist <= radii) {
					const angle = Math.atan2(body.position.y - this.position.y, body.position.x - this.position.x);
					body.velocity.angle = angle;
				}
			});
	}

	/**
	 * http://natureofcode.com/book/chapter-2-forces/, Chapter 2.7
	 * friction: -1 * u * N * v;
	 * friction: opposite direction of normalized velocity
	 *
	 * @param {Number} u coefficient of friction, constant
	 * @param {N} N: normal force, for now constant 1
	 */
	applyFriction(u = 0.08, N = 1) {
		const friction = this.velocity
			.clone()
			.normalize()
			.multiplySelf(-1)
			.multiplySelf(u)
			.multiplySelf(N);

		this.applyForce(friction);
	}

	/**
	 * http://natureofcode.com/book/chapter-2-forces/, Chapter 2.6
	 * the applied acceleration is calculated: as acceleration = force / mass
	 * applied gravity is the same for objects with different masses, therefore
	 * gravity = gravity * mass
	 *
	 * @param {Vector} gravity
	 */
	applyGravity(gravity) {
		this.applyForce(gravity.multiply(this.mass));
	}

	/**
	 * http://natureofcode.com/book/chapter-2-forces/, Chapter 2.8
	 * Fd = -0.5 * (p * v^2) * A * Cd * u
	 *
	 * @param {Number} p density of liquid, constant. default 1
	 * @param {Number} A frontal area of object pushing through the liquid, default 1
	 * @param {Number} Cd coefficient of drag, constant. default 0.1
	 */
	applyDrag(p = 1, A = 1, Cd = 0.1) {
		// force drag = -0.5 * (p * (v * v)) * A * cD * u
		// force drag = -0.5 * (p * (speed * speed)) * A * cD * u
		// force drag = -0.5 * (p * (speed * speed)) * A * cD * normalized velocity
		const speed = this.velocity.length;
		const magnitude = (p * speed * speed) * A * Cd;

		const drag = this.velocity
			.clone()
			.normalize()
			.multiplySelf(-0.5)
			.multiplySelf(magnitude);

		this.applyForce(drag);
	}

	/**
	 * http://natureofcode.com/book/chapter-2-forces/, chapter 2.9
	 * http://natureofcode.com/book/imgs/chapter02/ch02_06.png
	 *
	 * F = ((G * m1 * m2) / r^2) * r
	 * G = constant, 0.4
	 * m1, m2, masses of bodies
	 * r: unit vector (normalized) pointing from p1 to p2
	 * r^2: distance squared
	 * @param {Array} bodies
	 */
	attract(movers, G = 0.4, isRepelling = false) {
		movers = Array.isArray(movers) ? movers : [movers];

		movers.forEach((mover) => {
			const r = this.position.subtract(mover.position);
			let distance = r.length;
			distance = Math.max(5, Math.min(distance, 25));

			const mod = isRepelling ? -1 : 1;
			const strength = mod * (G * this.mass * mover.mass) / (distance * distance);

			r.normalize();
			r.multiplySelf(strength);

			mover.applyForce(r);
		});
	}

	/**
	 * Apply force
	 * @param {Vector} force
	 */
	applyForce(force) {
		// force = mass * acceleration
		// acceleration = force / mass
		this.acceleration.addSelf(force.divide(this.mass));
	}

	update() {
		this.velocity.addSelf(this.acceleration);
		this.position.addSelf(this.velocity);
		this.acceleration.multiplySelf(0);
	}
}
